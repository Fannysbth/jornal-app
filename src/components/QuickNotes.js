import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { FiPlus, FiTrash2, FiEdit, FiSave, FiX } from 'react-icons/fi'

export default function QuickNotes({ userId }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchNotes()
    }
  }, [userId])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quick_notes')
        .insert([{
          user_id: userId,
          content: newNote.trim()
        }])
        .select()

      if (error) throw error
      
      setNotes(prev => [data[0], ...prev])
      setNewNote('')
      setShowForm(false)
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note')
    } finally {
      setLoading(false)
    }
  }

  const updateNote = async (id) => {
    if (!editingContent.trim()) return

    try {
      const { error } = await supabase
        .from('quick_notes')
        .update({ 
          content: editingContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      setNotes(prev => prev.map(note => 
        note.id === id 
          ? { ...note, content: editingContent.trim(), updated_at: new Date().toISOString() }
          : note
      ))
      setEditingId(null)
      setEditingContent('')
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note')
    }
  }

  const deleteNote = async (id) => {
    if (!confirm('Delete this quick note?')) return

    try {
      const { error } = await supabase
        .from('quick_notes')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setNotes(prev => prev.filter(note => note.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const startEditing = (note) => {
    setEditingId(note.id)
    setEditingContent(note.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingContent('')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now - date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="card-glass p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gradient-primary">
          📝 Quick Notes
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="icon-btn-blue hover-scale"
          title="Add quick note"
        >
          {showForm ? <FiX size={18} /> : <FiPlus size={18} />}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 animate-fade-in space-y-3">
            <input
              type="text"
              value={newNote} 
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Quick note..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && addNote()}
              maxLength={200}
            />
            <button
              onClick={addNote}
              disabled={loading || !newNote.trim()}
              className="px-4 py-2  btn-primary flex items-center"
            >
              <FiPlus size={14} />
               <span className="hidden sm:inline">Add</span>
            </button>
          <div className="text-xs text-gray-500 mt-1">
            {newNote.length}/200 characters
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            No quick notes yet. Add one above! 📝
          </div>
        ) : (
          notes.map((note, index) => (
            <div 
              key={note.id} 
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    rows="2"
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {editingContent.length}/200 characters
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateNote(note.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center gap-1"
                      >
                        <FiSave size={12} />
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors flex items-center gap-1"
                      >
                        <FiX size={12} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(note.updated_at || note.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditing(note)}
                      className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                      title="Edit"
                    >
                      <FiEdit size={14} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}