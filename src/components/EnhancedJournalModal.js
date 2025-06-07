import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { FiX, FiSave, FiTag, FiHeart } from 'react-icons/fi'

export default function JournalModal({ isOpen, onClose, userId, journal = null }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
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
    } else {
      resetForm()
    }
  }, [journal])

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    const count = words.length
    setWordCount(count)
    setReadingTime(Math.ceil(count / 200))
  }, [content])

  const fetchTagSuggestions = async () => {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${tagInput}%`)
      .limit(5)
      
    if (data) {
      setTagSuggestions(data.map(item => item.name).filter(tag => !tags.includes(tag)))
    }
  }

  useEffect(() => {
    if (tagInput.length > 0) {
      fetchTagSuggestions()
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
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
        tags,
        is_favorite: isFavorite,
        word_count: wordCount,
        reading_time: readingTime,
        user_id: userId
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

      // Handle tags
      if (tags.length > 0) {
        // Clear existing tags first
        await supabase
          .from('journal_tags')
          .delete()
          .eq('journal_id', journalId)

        // Check existing tags and create new ones if needed
        for (const tagName of tags) {
          let { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .eq('user_id', userId)
            .single()

          let tagId
          if (!existingTag) {
            // Create new tag
            const { data: newTag } = await supabase
              .from('tags')
              .insert([{ name: tagName, user_id: userId }])
              .select()
              .single()
            tagId = newTag.id
          } else {
            tagId = existingTag.id
          }

          // Link tag to journal
          await supabase
            .from('journal_tags')
            .insert([{ journal_id: journalId, tag_id: tagId }])
        }
      }

      onClose()
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {journal ? '✏️ Edit Entry' : '📝 New Journal Entry'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind today?"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Content *
                </label>
                <div className="text-sm text-gray-500">
                  {wordCount} words • {readingTime} min read
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts here..."
                rows="12"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FiTag size={16} />
                Tags
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagAdd}
                  onFocus={() => tagInput && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Add tags (press Enter or comma to add)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                
                {showSuggestions && tagSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {tagSuggestions.map(tag => (
                      <div
                        key={tag}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onMouseDown={() => {
                          setTags([...tags, tag])
                          setTagInput('')
                        }}
                      >
                        #{tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {tags.length}/10 tags
              </div>
            </div>

            {/* Favorite Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FiHeart size={16} className={isFavorite ? 'text-indigo-500' : 'text-gray-400'} />
                  Mark as favorite
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <FiSave size={16} />
              {loading ? 'Saving...' : journal ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}