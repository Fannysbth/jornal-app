import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Check, Edit, Calendar, Star, Clock, Filter,
  Search, MoreVertical, AlertCircle, CheckCircle2, Circle,
  Target, Zap, Flag, Archive, RotateCcw
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient'
import { useSession } from '@supabase/auth-helpers-react';

export default function AdvancedTodos() {
  const session = useSession();
  const user = session?.user;

  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');

  const fetchTodos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [user]);

  const addTodo = async () => {
    if (!newTask.trim() || !user) return;

    const newTodo = {
      task: newTask,
      user_id: user.id,
      is_completed: false,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([newTodo])
        .select();

      if (error) throw error;

      setTodos([...(data || []), ...todos]);
      setNewTask('');
    } catch (error) {
      console.error('Error adding todo:', error.message);
    }
  };

  const toggleComplete = async (id, isCompleted) => {
    try {
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, is_completed: !isCompleted } : todo
      ));

      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !isCompleted })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling todo:', error.message);
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setTodos(todos.filter(todo => todo.id !== id));

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting todo:', error.message);
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.task);
  };

  const saveEdit = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ task: editText })
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, task: editText } : todo
      ));
      setEditingId(null);
    } catch (error) {
      console.error('Error editing todo:', error.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
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
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.is_completed).length,
    pending: todos.filter(t => !t.is_completed).length,
    completionRate: todos.length > 0
      ? Math.round((todos.filter(t => t.is_completed).length / todos.length) * 100)
      : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <style jsx>{`
        .btn-primary {
          @apply px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105;
        }
        .btn-secondary {
          @apply px-4 py-2 bg-white/20 backdrop-blur-sm text-gray-700 rounded-lg font-semibold border border-white/30 shadow-lg transition-all duration-300 hover:bg-white/30;
        }
        .btn-danger {
          @apply px-3 py-2 bg-red-500 text-white rounded-lg font-semibold shadow-lg transition-all duration-300 hover:bg-red-600 hover:scale-105;
        }
        .btn-icon {
          @apply p-2 rounded-lg transition-all duration-300 hover:scale-105;
        }
        .card-glass {
          @apply bg-white/70 backdrop-blur-md rounded-xl border border-white/20 shadow-xl;
        }
        .input-glass {
          @apply bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300;
        }
        .text-gradient {
          @apply bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold;
        }
        .hover-lift {
          @apply transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card-glass p-6 mb-8 hover-lift">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-gradient text-4xl mb-2">My Todo List</h1>
              <p className="text-gray-600">Stay organized and productive</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
                <div className="text-xs text-gray-500">Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Task */}
        <div className="card-glass p-6 mb-8 hover-lift">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-blue-500" />
            Add New Task
          </h2>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="What needs to be done?"
              className="input-glass flex-1"
            />
            <button
              onClick={addTodo}
              className="btn-primary"
              disabled={!newTask.trim()}
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Add Task
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card-glass p-6 mb-8 hover-lift">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass w-full pl-10"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-glass"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-glass"
            >
              <option value="created_at">Sort by Date</option>
              <option value="alphabetical">Sort A-Z</option>
              <option value="completed">Sort by Status</option>
            </select>
            
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`btn-secondary ${showCompleted ? 'bg-blue-100/50' : ''}`}
            >
              {showCompleted ? 'Hide' : 'Show'} Completed
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {loading ? (
            <div className="card-glass p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your tasks...</p>
            </div>
          ) : sortedTodos.length === 0 ? (
            <div className="card-glass p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-gradient text-xl mb-2">No tasks found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? "Try adjusting your filters"
                  : "Add your first task to get started!"
                }
              </p>
            </div>
          ) : (
            sortedTodos.map((todo) => (
              <div 
                key={todo.id}
                className={`card-glass p-6 hover-lift transition-all duration-300 ${
                  todo.is_completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(todo.id, todo.is_completed)}
                    className={`btn-icon ${
                      todo.is_completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                    }`}
                  >
                    {todo.is_completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === todo.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') saveEdit(todo.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                          className="input-glass flex-1 font-medium"
                        />
                        <button
                          onClick={() => saveEdit(todo.id)}
                          className="btn-icon bg-green-100 text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn-icon bg-gray-100 text-gray-600"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p 
                          className={`font-medium text-lg cursor-pointer ${
                            todo.is_completed 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-800'
                          }`}
                          onDoubleClick={() => startEditing(todo)}
                        >
                          {todo.task}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Created: {new Date(todo.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== todo.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(todo)}
                        className="btn-icon bg-blue-100 text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="btn-icon bg-red-100 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Progress Bar */}
        {todos.length > 0 && (
          <div className="card-glass p-6 mt-8 hover-lift">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">
                {stats.completed} of {stats.total} tasks completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <span className="text-2xl font-bold text-gradient">
                {stats.completionRate}%
              </span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="card-glass p-6 mt-8 hover-lift">
          <h3 className="font-semibold text-gray-700 mb-2">How to use:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Double-click any task to edit it</li>
            <li>• Click the circle to mark tasks as complete</li>
            <li>• Use filters to organize your view</li>
            <li>• Press Enter to quickly add new tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}