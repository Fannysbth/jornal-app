import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Check, Edit, Calendar, Star, Clock, Filter,
  Search, MoreVertical, AlertCircle, CheckCircle2, Circle,
  Target, Zap, Flag, Archive, RotateCcw
} from 'lucide-react';

import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext';




export default function AdvancedTodos() {
  const { user } = useAuth()
  const [showAddForm, setShowAddForm] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
  if (user) {
    fetchTodos();
  }
}, [user]);

const fetchTodos = async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching todos:', error.message);
  } else {
    setTodos(data);
  }
  setLoading(false);
};
const addTodo = async () => {
 if (!newTask.trim()) return alert('Task cannot be empty')
     const { data, error } = await supabase
       .from('todos')
       .insert([{ task: newTask.trim(), deadline: newDeadline || null, is_completed: false, user_id: user.id  } ])
       .select()
       .single()
     if (error) return alert('Failed to add task: ' + error.message)
     setTodos([data, ...todos])
     setNewTask('')
     setNewDeadline('')
     setShowAddForm(false)
};


  const toggleComplete = async (id, isCompleted) => {
  const { error } = await supabase
    .from('todos')
    .update({ is_completed: !isCompleted })
    .eq('id', id);

  if (error) {
    console.error('Error toggling complete:', error.message);
  } else {
    fetchTodos();
  }
};


  const deleteTodo = async (id) => {
  if (!window.confirm('Are you sure you want to delete this task?')) return;

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting todo:', error.message);
  } else {
    setTodos(todos.filter(todo => todo.id !== id))
  }
};


  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.task);
    setEditDeadline(todo.deadline || '');
  };

  async function saveEdit(id) {
      if (!editText.trim()) return alert('Task cannot be empty')
      const { error } = await supabase
        .from('todos')
        .update({ task: editText.trim(), deadline: editDeadline || null })
        .eq('id', id)
      if (error) return alert('Failed to update task: ' + error.message)
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, task: editText.trim(), deadline: editDeadline || null } : todo
      ))
      setEditingId(null)
      setEditText('')
      setEditDeadline('')
    }


  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditDeadline('');
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.task.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && todo.is_completed) ||
      (filterStatus === 'pending' && !todo.is_completed);
    const showIfCompleted = showCompleted || !todo.is_completed;

    return matchesSearch && matchesStatus && showIfCompleted;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.task.localeCompare(b.task);
      case 'completed':
        return a.is_completed - b.is_completed;
      case 'deadline':
        return (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31');
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const checkDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    
    if (deadlineDate < today) {
      return 'overdue';
    } else if (deadlineDate.toDateString() === today.toDateString()) {
      return 'today';
    }
    return null;
  };

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.is_completed).length,
    pending: todos.filter(t => !t.is_completed).length,
    overdue: todos.filter(t => !t.is_completed && checkDeadlineStatus(t.deadline) === 'overdue').length,
    completionRate: todos.length > 0
      ? Math.round((todos.filter(t => t.is_completed).length / todos.length) * 100)
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 ">
        
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                My Todo List
              </h1>
              <p className="text-gray-600 text-lg">Stay organized and productive every day</p>
            </div>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Pending', value: stats.pending, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Overdue', value: stats.overdue, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Progress', value: `${stats.completionRate}%`, color: 'text-purple-600', bg: 'bg-purple-50' }
              ].map((stat, index) => (
                <div key={index} className={`${stat.bg} rounded-xl p-4 text-center border border-white/30`}>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add New Task Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            Add New Task
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="What needs to be done?"
                className="flex-1 bg-white/70 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <button
                onClick={addTodo}
                disabled={!newTask.trim()}
                className="px-6 py-3 btn-primary flex items-center"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="bg-white/70 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <span className="text-sm text-gray-500">Optional deadline</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-center text-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/70 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/70 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/70 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="created_at">Sort by Date</option>
              <option value="alphabetical">Sort A-Z</option>
              <option value="completed">Sort by Status</option>
              <option value="deadline">Sort by Deadline</option>
            </select>
            
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                showCompleted 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-white/70 text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {showCompleted ? 'Hide' : 'Show'} Completed
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your tasks...</p>
            </div>
          ) : sortedTodos.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Target className="h-16 w-16 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">No tasks found</p>
              <p className="text-gray-400">Add a new task to get started!</p>
            </div>
          ) : (
            sortedTodos.map(todo => {
              const deadlineStatus = checkDeadlineStatus(todo.deadline);
              
              return (
                <div
                  key={todo.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
                    todo.is_completed ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(todo.id, todo.is_completed)}
                      className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 mt-1"
                    >
                      {todo.is_completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 hover:text-blue-500" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      {editingId === todo.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(todo.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <input
                              type="date"
                              value={editDeadline}
                              onChange={(e) => setEditDeadline(e.target.value)}
                              className="bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className={`text-lg ${todo.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            {todo.task}
                          </p>
                          {todo.deadline && (
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className={`text-sm ${
                                deadlineStatus === 'overdue' ? 'text-red-600 font-semibold' : 
                                deadlineStatus === 'today' ? 'text-orange-600 font-semibold' : 'text-gray-500'
                              }`}>
                                {new Date(todo.deadline).toLocaleDateString()}
                                {deadlineStatus === 'overdue' && ' (Overdue!)'}
                                {deadlineStatus === 'today' && ' (Due Today!)'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex gap-2">
                      {editingId === todo.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(todo.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(todo)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                            title="Edit task"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}