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


export default function EnhancedJournalModal({ isOpen, onClose, userId, journal = null, mode = "create" }) {
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
  const [modalMode, setModalMode] = useState("view");

  const readOnly = mode === "view"

  useEffect(() => {
    if (journal && (mode === 'view' || mode === 'edit')) {
      setTitle(journal.title || '')
      setContent(journal.content || '')
      setTags(journal.tags ? (typeof journal.tags === 'string' ? JSON.parse(journal.tags) : journal.tags) : [])
      setIsFavorite(journal.is_favorite || false)
      setMood(journal.mood || '')
    } else if (mode === 'create') {
      resetForm()
    }
  }, [journal, mode])

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    const count = words.length
    setWordCount(count)
    setReadingTime(Math.ceil(count / 200)) // asumsi baca 200 kata per menit
  }, [content])

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
      setTagSuggestions(data?.map(item => item.name).filter(t => !tags.some(tag => tag.name === t)) || [])
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
      const alreadyExists = tags.some(tag => tag.name === newTag)
      if (newTag && !alreadyExists) {
        if (tags.length < 10) {
          setTags([...tags, { name: newTag } ])
          setTagInput('')
        } else {
          alert('Maximum 10 tags allowed')
        }
      }
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag.name !== tagToRemove.name))
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
        for (const tagObj of tags) {
          const tagName = tagObj.name
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
            
            if (tagName.length > 50) {
             console.warn(`Tag "${tagName}" exceeds 50 characters and will be skipped.`)
             continue 
          }
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
      className="modal-glass animate-fade-in overflow-y-auto max-w-lg w-full p-6 relative"
    >
      <button
        type="button"
        onClick={() => {
          resetForm()
          onClose(false)
        }}
        className="absolute top-4 right-4 icon-btn icon-btn-red"
      >
        <FiX size={24} />
      </button>

      <h2 className="text-2xl font-semibold mb-4 text-gradient-primary">
        {mode === "view" ? "Detail Journal" : journal ? "Edit Journal" : "New Journal"}
      </h2>

      <input
        type="text"
        placeholder="Title"
        className="input-glass mb-4"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        readOnly={mode === "view"}
      />

      <textarea
        placeholder="Write your journal here..."
        className="textarea-glass mb-4"
        value={content}
        onChange={e => setContent(e.target.value)}
        required
        readOnly={mode === "view"}
      />

      {/* Mood selection */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <span className="mr-2 font-medium text-gray-700">Mood:</span>
        {moods.map(m => (
          <button
            type="button"
            key={m.value}
            onClick={() => mode !== "view" && setMood(m.value === mood ? '' : m.value)}
            className={`tag-colorful ${
              mood === m.value
                ? 'bg-blue-500 text-white hover:scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
            }`}
            disabled={mode === "view"}
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
          className="w-4 h-4 accent-pink-500"
          disabled={mode === "view"}
        />
        <label htmlFor="favorite" className="select-none text-gray-700">
          Mark as Favorite
        </label>
      </div>

      {/* Tags input */}
      <div className="mb-4 relative">
        <label htmlFor="tags" className="block font-medium mb-1 text-gray-700">
          Tags (max 10):
        </label>
        {mode !== "view" && (
          <>
        <input
          id="tags"
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value.toLowerCase())}
          onKeyDown={handleTagAdd}
          placeholder="Add a tag and press Enter or comma"
          className="input-glass"
          autoComplete="off"
        />
        {showSuggestions && tagSuggestions.length > 0 && mode !== "view" && (
          <ul className="absolute z-10 bg-white border border-gray-300 rounded shadow mt-1 max-h-40 overflow-auto w-full text-sm">
            {tagSuggestions.map(suggestion => (
              <li
                key={suggestion}
                className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => {
                  if (tags.length < 10 && !tags.some(tag => tag.name === suggestion)) {
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
        </>
      )}
      </div>

      {/* Tags display */}
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="tag-blue flex items-center gap-1"
            >
              <span>#{tag.name}</span>
              {mode !== "view" && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="icon-btn icon-btn-red p-0"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

      {/* Word count & reading time */}
      <div className="mb-4 text-gray-600 text-sm">
        Word count: {wordCount} | Estimated reading time: {readingTime} min
      </div>

      {/* Submit button hanya tampil kalau mode bukan view */}
      {mode !== "view" && (
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FiSave size={18} />
          {loading ? 'Saving...' : 'Save Journal'}
        </button>
      )}
    </form>
  </div>
)
}