import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { CheckCircle2, Circle, Edit, Trash2 } from 'lucide-react'
import { FiPlus } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';


export default function TodoProgressAndList() {
   const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

 useEffect(() => {
  if (user) {
    fetchTodos()
  }
}, [user])

  async function fetchTodos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      alert('Failed to fetch todos: ' + error.message)
    } else {
      setTodos(data)
    }
    setLoading(false)
  }

  
  async function toggleComplete(id, isCompleted) {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !isCompleted })
      .eq('id', id)
    if (error) return alert('Failed to update task: ' + error.message)
      await fetchTodos()
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, is_completed: !isCompleted } : todo
    ))
  }
 
  async function deleteTodo(id) {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
    if (error) return alert('Failed to delete task: ' + error.message)
      await fetchTodos()
    setTodos(todos.filter(todo => todo.id !== id))
  }

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
    await fetchTodos()
    setEditingId(null)
    setEditText('')
    setEditDeadline('')
  }

  async function addTask() {
    if (!newTask.trim()) return alert('Task cannot be empty')
    const { data, error } = await supabase
      .from('todos')
      .insert([{ task: newTask.trim(), deadline: newDeadline || null, is_completed: false, user_id: user.id }])
      .select()
      .single()
    if (error) return alert('Failed to add task: ' + error.message)
    await fetchTodos()
    setNewTask('')
    setNewDeadline('')
    setShowAddForm(false)
  }

  function startEditing(todo) {
    setEditingId(todo.id)
    setEditText(todo.task)
    setEditDeadline(todo.deadline || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
    setEditDeadline('')
  }

  const checkDeadlineStatus = (deadline) => {
    if (!deadline) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadlineDate = new Date(deadline)

    if (deadlineDate < today) return 'overdue'
    if (deadlineDate.toDateString() === today.toDateString()) return 'today'
    return null
  }

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.is_completed).length,
    completionRate: todos.length > 0
      ? Math.round((todos.filter(t => t.is_completed).length / todos.length) * 100)
      : 0
  }

  return (
    <div className="card-glass p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gradient">
          My Todo List
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          title={showAddForm ? 'Cancel adding task' : 'Add new task'}
        >
          {showAddForm ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 animate-fade-in space-y-3">
          <input
            type="text"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="New task description"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="date"
            value={newDeadline}
            onChange={e => setNewDeadline(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={addTask}
            className="px-4 py-2  btn-primary flex items-center"
          >
            <Plus className="h-4 w-4" />Add Task
          </button>
        </div>
      )}

      <div className="mb-6 p-5 bg-blue-50 rounded-lg text-center shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Progress</h2>
        <p className="text-2xl font-bold text-green-700">{stats.completionRate}%</p>
        <p className="text-sm text-gray-600">{stats.completed} of {stats.total} tasks done</p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : todos.length === 0 ? (
          <p className="text-center text-gray-500">No tasks found.</p>
        ) : (
          todos.map((todo, i) => {
            const deadlineStatus = checkDeadlineStatus(todo.deadline)
            return (
              <div
                key={todo.id}
                className={`p-4 bg-white rounded-lg shadow flex items-center justify-between transition hover:shadow-lg hover:-translate-y-0.5
                  ${todo.is_completed ? 'opacity-60 line-through' : ''}
                `}
                style={{ animation: `fadeIn 0.3s ease forwards`, animationDelay: `${i * 0.07}s` }}
              >
                <button onClick={() => toggleComplete(todo.id, todo.is_completed)}>
                  {todo.is_completed
                    ? <CheckCircle2 className="text-green-500" />
                    : <Circle className="text-gray-400" />}
                </button>

                <div className="flex-1 px-4 select-none">
                  {editingId === todo.id ? (
                    <>
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                      <input
                        type="date"
                        value={editDeadline}
                        onChange={e => setEditDeadline(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded mt-1"
                      />
                    </>
                  ) : (
                    <>
                      <p>{todo.task}</p>
                      {todo.deadline && (
                        <p className={`text-xs mt-1 ${
                          deadlineStatus === 'overdue' ? 'text-red-600 font-semibold' :
                          deadlineStatus === 'today' ? 'text-orange-600 font-semibold' :
                          'text-gray-400'
                        }`}>
                          Due: {new Date(todo.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {editingId === todo.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="text-green-600 hover:underline"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(todo)}
                        title="Edit"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
