import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { FiX, FiSave, FiTag, FiHeart, FiPlus, FiSearch } from 'react-icons/fi'

const moods = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'motivated', label: 'Motivated', emoji: '💪' }
]

function JournalCard({ journal, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{journal.title}</h3>
          {journal.is_favorite && (
            <FiHeart className="text-red-500 ml-2" size={18} />
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {journal.content.substring(0, 150)}{journal.content.length > 150 ? '...' : ''}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Render tags as badges */}
          {journal.tags?.map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{new Date(journal.created_at).toLocaleDateString()}</span>
          <span>{journal.reading_time} min read</span>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default function EnhancedJournalModal({ isOpen, onClose, userId, journal = null }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mood, setMood] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)

  useEffect(() => {
    if (journal) {
      setTitle(journal.title || '')
      setContent(journal.content || '')
      setTags(journal.tags || [])
      setIsFavorite(journal.is_favorite || false)
      setMood(journal.mood || '')
    } else {
      resetForm()
    }
  }, [journal])

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    const count = words.length
    setWordCount(count)
    setReadingTime(Math.ceil(count / 200)) // asumsi baca 200 kata per menit
  }, [content])

  // Fetch tag suggestions from supabase based on input
  const fetchTagSuggestions = async () => {
    if (!tagInput) return setTagSuggestions([])

    const { data, error } = await supabase
      .from('tags')
      .select('name')
      .eq('user_id', userId)
      .ilike('name', `%${tagInput}%`)
      .limit(5)

    if (error) {
      console.error('Error fetching tag suggestions:', error)
      setTagSuggestions([])
    } else {
      // Filter out tags already in current tags list
      setTagSuggestions(data?.map(item => item.name).filter(t => !tags.includes(t)) || [])
    }
  }

  useEffect(() => {
    if (tagInput.length > 0) {
      fetchTagSuggestions()
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setTagSuggestions([])
    }
  }, [tagInput])

  const resetForm = () => {
    setTitle('')
    setContent('')
    setTags([])
    setTagInput('')
    setIsFavorite(false)
    setWordCount(0)
    setReadingTime(0)
    setMood('')
  }

  const handleTagAdd = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (newTag && !tags.includes(newTag)) {
        if (tags.length < 10) {
          setTags([...tags, newTag])
          setTagInput('')
        } else {
          alert('Maximum 10 tags allowed')
        }
      }
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content')
      return
    }

    try {
      setLoading(true)

      const journalData = {
        title: title.trim(),
        content: content.trim(),
        is_favorite: isFavorite,
        word_count: wordCount,
        reading_time: readingTime,
        user_id: userId,
        mood: mood
      }

      let journalId = journal?.id

      if (journal) {
        // Update existing journal
        const { error } = await supabase
          .from('journals')
          .update(journalData)
          .eq('id', journalId)

        if (error) throw error
      } else {
        // Create new journal
        const { data, error } = await supabase
          .from('journals')
          .insert([journalData])
          .select()
          .single()

        if (error) throw error
        if (data) journalId = data.id
      }

      // Handle tags association
      if (tags.length > 0) {
        if (!journalId) throw new Error('journalId is undefined!')

        // Remove old journal_tags
        const { error: delError } = await supabase
          .from('journal_tags')
          .delete()
          .eq('journal_id', journalId)

        if (delError) throw delError

        // For each tag, ensure tag exists, then link
        for (const tagName of tags) {
          // Check if tag exists
          const { data: existingTags, error: tagError } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .eq('user_id', userId)
            .limit(1)

          if (tagError) throw tagError

          let tagId
          if (!existingTags || existingTags.length === 0) {
            // Insert new tag
            const { data: newTags, error: insertTagError } = await supabase
              .from('tags')
              .insert([{ name: tagName, user_id: userId }])
              .select()
              .single()

            if (insertTagError) throw insertTagError

            tagId = newTags.id
          } else {
            tagId = existingTags[0].id
          }

          // Insert journal_tag link
          const { error: journalTagError } = await supabase
            .from('journal_tags')
            .insert([{ journal_id: journalId, tag_id: tagId }])

          if (journalTagError) throw journalTagError
        }
      } else {
        // If no tags, ensure old tags are removed
        if (journalId) {
          await supabase
            .from('journal_tags')
            .delete()
            .eq('journal_id', journalId)
        }
      }

      onClose(true)
      resetForm()
    } catch (error) {
      console.error('Error saving journal:', error)
      alert(`Failed to save journal entry: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg max-w-3xl w-full p-6 relative shadow-lg max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={() => {
            resetForm()
            onClose(false)
          }}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-semibold mb-4">{journal ? 'Edit Journal' : 'New Journal'}</h2>

        <input
          type="text"
          placeholder="Title"
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Write your journal here..."
          className="w-full mb-4 h-48 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400 resize-none"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />

        {/* Mood selection */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="mr-2 font-medium">Mood:</span>
          {moods.map(m => (
            <button
              type="button"
              key={m.value}
              onClick={() => setMood(m.value === mood ? '' : m.value)}
              className={`px-3 py-1 rounded-full border ${
                mood === m.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              } flex items-center gap-1 transition-colors`}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>

        {/* Favorite toggle */}
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="favorite"
            checked={isFavorite}
            onChange={e => setIsFavorite(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="favorite" className="select-none">Mark as Favorite</label>
        </div>

        {/* Tags input */}
        <div className="mb-4 relative">
          <label htmlFor="tags" className="block font-medium mb-1">
            Tags (max 10):
          </label>
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value.toLowerCase())}
            onKeyDown={handleTagAdd}
            placeholder="Add a tag and press Enter or comma"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400"
            autoComplete="off"
          />
          {showSuggestions && tagSuggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 rounded shadow mt-1 max-h-40 overflow-auto w-full text-sm">
              {tagSuggestions.map(suggestion => (
                <li
                  key={suggestion}
                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    if (tags.length < 10) {
                      setTags([...tags, suggestion])
                      setTagInput('')
                      setShowSuggestions(false)
                    }
                  }}
                >
                  #{suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tags display */}
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map(tag => (
            <div
              key={tag}
              className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-sm"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-gray-600 hover:text-gray-900"
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Word count & reading time */}
        <div className="mb-4 text-gray-600 text-sm">
          Word count: {wordCount} | Estimated reading time: {readingTime} min
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          <FiSave size={18} />
          {loading ? 'Saving...' : 'Save Journal'}
        </button>
      </form>
    </div>
  )
}
