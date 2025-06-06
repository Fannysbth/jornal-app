import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiTrash2, FiCheck, FiEdit } from 'react-icons/fi';

export default function Todos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (user) fetchTodos();
  }, [user]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTask.trim()) return;
    try {
      const { error } = await supabase
        .from('todos')
        .insert([{ task: newTask, user_id: user.id }]);

      if (error) throw error;
      setNewTask('');
      fetchTodos();
    } catch (error) {
      alert(error.message);
    }
  };

  const toggleComplete = async (id, isCompleted) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !isCompleted })
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (error) {
      alert(error.message);
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
      setEditingId(null);
      fetchTodos();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My To-Do List</h1>
      
      <div className="flex mb-6">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
        >
          <FiPlus size={20} />
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : todos.length === 0 ? (
        <p className="text-gray-500">No tasks yet. Add your first one!</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li 
              key={todo.id}
              className={`p-3 border rounded flex items-center justify-between ${
                todo.is_completed ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-center">
                <button
                  onClick={() => toggleComplete(todo.id, todo.is_completed)}
                  className={`p-1 rounded-full mr-3 ${
                    todo.is_completed ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-100'
                  }`}
                >
                  <FiCheck size={16} />
                </button>
                
                {editingId === todo.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => saveEdit(todo.id)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit(todo.id)}
                    autoFocus
                    className="px-2 py-1 border-b focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <span 
                    className={`${todo.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}
                    onDoubleClick={() => startEditing(todo)}
                  >
                    {todo.task}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                {editingId !== todo.id && (
                  <button
                    onClick={() => startEditing(todo)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <FiEdit size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
