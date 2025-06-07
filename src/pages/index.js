import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import {
  FiHome, FiEdit, FiTrash2, FiPlus, FiHeart, FiStar, FiBookmark, FiClock,
  FiTrendingUp, FiGrid, FiList, FiFilter
} from 'react-icons/fi'
import ExportButton from '../components/ExportButton'
import DashboardStats from '../components/DashboardStats'
import SearchFilter from '../components/SearchFilter'
import QuickNotes from '../components/QuickNotes'
import MoodTracker from '../components/MoodTracker'
import JournalStreaks from '../components/JournalStreaks'

// Array warna untuk tag
const tagColors = ['tag-blue', 'tag-purple', 'tag-pink', 'tag-green', 'tag-yellow', 'tag-orange', 'tag-indigo']

const ReadingTimeUtils = ({ text }) => {
  const estimateReadingTime = (text) => {
    const wordsPerMinute = 200
    const words = text.trim().split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return minutes
  }

  return (
    <span className="text-sm text-gray-500 flex items-center">
      <FiClock className="h-4 w-4 mr-1" />
      {estimateReadingTime(text)} min read
    </span>
  )
}

const EnhancedJournalModal = ({ isOpen, onClose, entry, onSave }) => {
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content || '')
  const [tags, setTags] = useState(entry?.tags || [])
  const [mood, setMood] = useState(entry?.mood || 'neutral')
  const [newTag, setNewTag] = useState('')

  if (!isOpen) return null

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content cannot be empty.")
      return
    }

    onSave({
      id: entry?.id || Date.now(),
      title,
      content,
      tags,
      mood,
      date: entry?.date || new Date().toISOString(),
      wordCount: content.trim().split(/\s+/).length
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{entry ? 'Edit Entry' : 'New Journal Entry'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Entry title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Mood</label>
            <div className="flex gap-2">
              {[
                { mood: 'happy', icon: '😊' },
                { mood: 'neutral', icon: '😐' },
                { mood: 'sad', icon: '😢' }
              ].map(({ mood: moodOption, icon }) => (
                <button
                  key={moodOption}
                  onClick={() => setMood(moodOption)}
                  className={`p-2 rounded border ${mood === moodOption ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-1 border rounded text-sm"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Add
              </button>
            </div>
          </div>

          <textarea
            placeholder="Write your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          <div className="text-sm text-gray-500">
            {content.trim().split(/\s+/).length} words • <ReadingTimeUtils text={content} />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Save Entry</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [journals, setJournals] = useState([])
  const [filteredJournals, setFilteredJournals] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentJournal, setCurrentJournal] = useState(null)
  const [view, setView] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user) fetchJournals()
  }, [user])

  const fetchJournals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('journal_entries_with_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedData = data?.map(journal => ({
        ...journal,
        word_count: journal.word_count || calculateWordCount(journal.content || ''),
        reading_time: journal.reading_time || calculateReadingTime(journal.content || '')
      })) || []

      setJournals(processedData)
      setFilteredJournals(processedData)

      const tags = new Set()
      processedData.forEach(journal => {
        journal.tags?.forEach(tag => tags.add(tag))
      })
      setAllTags(Array.from(tags))
    } catch (error) {
      console.error('Error fetching journals:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateWordCount = (content) => {
    return content.trim().split(/\s+/).filter(Boolean).length
  }

  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200
    const wordCount = calculateWordCount(content)
    return Math.ceil(wordCount / wordsPerMinute) || 1
  }

  const applySorting = (journals, sortType) => {
    const sorted = [...journals]
    switch (sortType) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case 'favorites':
        return sorted.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0))
      case 'word_count':
        return sorted.sort((a, b) => (b.word_count || 0) - (a.word_count || 0))
      default:
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }

  const handleFilter = useCallback((filters) => {
    let filtered = [...journals]

    if (filters.searchTerm) {
      filtered = filtered.filter(j =>
        j.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        j.content.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    if (filters.selectedTags?.length) {
      filtered = filtered.filter(j =>
        j.tags?.some(tag => filters.selectedTags.includes(tag))
      )
    }

    if (filters.dateRange?.start) {
      filtered = filtered.filter(j =>
        new Date(j.created_at) >= new Date(filters.dateRange.start)
      )
    }

    if (filters.dateRange?.end) {
      const endDate = new Date(filters.dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(j =>
        new Date(j.created_at) <= endDate
      )
    }

    if (filters.showFavoritesOnly) {
      filtered = filtered.filter(j => j.is_favorite)
    }

    if (filters.moodFilter) {
      filtered = filtered.filter(j => j.mood === filters.moodFilter)
    }

    setFilteredJournals(applySorting(filtered, sortBy))
  }, [journals, sortBy])

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
    setFilteredJournals(applySorting([...filteredJournals], newSortBy))
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return
    try {
      const { error } = await supabase.from('journals').delete().eq('id', id)
      if (error) throw error
      fetchJournals()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleEdit = (journal) => {
    setCurrentJournal(journal)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setCurrentJournal(null)
    fetchJournals()
  }

  const toggleFavorite = async (journal) => {
    try {
      const { error } = await supabase
        .from('journals')
        .update({ is_favorite: !journal.is_favorite })
        .eq('id', journal.id)
      if (error) throw error
      fetchJournals()
    } catch (error) {
      console.error('Error updating favorite:', error)
    }
  }

  const getTotalWords = () => {
    return journals.reduce((total, journal) => total + (journal.word_count || 0), 0);
  };

  if (!user) {
    return (
      <div className="main-container">
        <div className="text-center py-16 animate-fade-in">
          <div className="mb-8">
            <FiHeart className="mx-auto text-6xl text-gradient-primary mb-4" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-rainbow mb-6">
            Welcome to MyJournal ✨
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
            Your personal space for thoughts, dreams, and memories. Start your journaling journey today and capture every beautiful moment! 🌟
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login" className="btn-primary hover-lift">
              <FiHome className="mr-2" /> Sign In to Continue
            </Link>
            <Link href="/signup" className="btn-secondary hover-lift">
              <FiStar className="mr-2" /> Create New Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-container">
      {/* Dashboard Stats */}
      <DashboardStats 
        userId={user.id} 
        totalEntries={journals.length}
        totalWords={getTotalWords()}
        favoriteCount={getFavoriteCount()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold text-gradient-primary mb-2">
                My Journal Entries 📖
              </h1>
              <p className="text-gray-600">
                Welcome back! Ready to capture today's moments?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary hover-lift animate-bounce-gentle"
              >
                <FiPlus className="mr-2" /> 
                New Entry
              </button>
              <ExportButton journals={journals} />
            </div>
          </div>

          {/* Mood Tracker */}
          <div className="mb-6">
            <MoodTracker userId={user.id} />
          </div>

          {/* Journal Streaks */}
          <div className="mb-6">
            <JournalStreaks userId={user.id} />
          </div>

          {/* Search & Filter */}
          <div className="mb-6">
            <SearchFilter onFilter={handleFilter} tags={allTags} />
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {filteredJournals.length} of {journals.length} entries
              </div>
              {journals.length > 0 && (
                <div className="text-sm text-gray-500">
                  • {getTotalWords().toLocaleString()} total words
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">A-Z</option>
                <option value="favorites">Favorites First</option>
                <option value="word_count">Most Words</option>
              </select>

              {/* View Toggle */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-md text-sm transition-colors ${
                    view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Grid View"
                >
                  <FiGrid size={16} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded-md text-sm transition-colors ${
                    view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="List View"
                >
                  <FiList size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          {loading ? (
            <div className="text-center py-20">
              <div className="spinner-colorful mx-auto mb-4"></div>
              <p className="text-gray-600 animate-pulse">Loading your beautiful memories...</p>
            </div>
          ) : filteredJournals.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="mb-6">
                <FiEdit className="mx-auto text-5xl text-gradient-warm mb-4" />
              </div>
              <h3 className="text-2xl font-semibold text-gradient-primary mb-4">
                {journals.length === 0 ? 'Your Journal Awaits! ✍️' : 'No entries match your filters'}
              </h3>
              <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                {journals.length === 0 
                  ? 'Every great story starts with a single word. Create your first journal entry and begin your amazing journey!'
                  : 'Try adjusting your search or filter criteria to find more entries.'
                }
              </p>
              {journals.length === 0 && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-accent hover-lift"
                >
                  <FiPlus className="mr-2" /> 
                  Write Your First Entry
                </button>
              )}
            </div>
          ) : (
            <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
              {filteredJournals.map((journal, index) => (
                <div 
                  key={journal.id} 
                  className={`card-glass hover-lift animate-fade-in relative group ${view === 'list' ? 'flex gap-4' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Favorite badge */}
                  {journal.is_favorite && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <FiHeart size={12} className="fill-current" />
                        Favorite
                      </div>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-16">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl md:text-2xl font-semibold text-gradient-primary line-clamp-2">
                            {journal.title}
                          </h2>
                          {journal.mood && (
                            <span className="text-2xl flex-shrink-0" title={journal.mood}>
                              {moodEmojis[journal.mood]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            📅 {new Date(journal.created_at).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            ⏰ {new Date(journal.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {journal.word_count > 0 && (
                            <span className="flex items-center gap-1">
                              <FiEdit size={14} />
                              {journal.word_count.toLocaleString()} words
                            </span>
                          )}
                          {journal.reading_time > 0 && (
                            <span className="flex items-center gap-1">
                              <FiClock size={14} />
                              {formatReadingTime(journal.reading_time)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleFavorite(journal)}
                          className={`icon-btn hover-scale transition-colors ${
                            journal.is_favorite ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'
                          }`}
                          title="Toggle favorite"
                        >
                          <FiHeart size={18} className={journal.is_favorite ? 'fill-current' : ''} />
                        </button>
                        <button
                          onClick={() => handleEdit(journal)}
                          className="icon-btn-blue hover-scale"
                          title="Edit entry"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(journal.id)}
                          className="icon-btn-red hover-scale"
                          title="Delete entry"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="prose max-w-none mb-4">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line line-clamp-3">
                        {journal.content}
                      </p>
                    </div>
                    
                    {journal.tags && journal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500 mr-2 flex items-center">
                          <FiBookmark size={12} className="mr-1" />
                          Tags:
                        </span>
                        {journal.tags.map((tag, tagIndex) => (
                          <span
                            key={tag}
                            className={`${getTagColor(tagIndex)} hover-scale cursor-pointer`}
                            onClick={() => handleFilter({ selectedTags: [tag] })}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <QuickNotes userId={user.id} />
          
          {/* Quick Stats Card */}
          <div className="card-glass">
            <h3 className="text-lg font-semibold text-gradient-primary mb-4 flex items-center gap-2">
              <FiTrendingUp />
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Entries</span>
                <span className="font-semibold text-blue-600">{journals.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Favorites</span>
                <span className="font-semibold text-pink-600">{getFavoriteCount()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Words</span>
                <span className="font-semibold text-green-600">{getTotalWords().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tags Used</span>
                <span className="font-semibold text-purple-600">{allTags.length}</span>
              </div>
            </div>
          </div>

          {/* Recent Tags */}
          {allTags.length > 0 && (
            <div className="card-glass">
              <h3 className="text-lg font-semibold text-gradient-primary mb-4 flex items-center gap-2">
                <FiBookmark />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map((tag, index) => (
                  <span
                    key={tag}
                    className={`${getTagColor(index)} cursor-pointer hover-scale text-sm`}
                    onClick={() => handleFilter({ selectedTags: [tag] })}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Journal Modal */}
      <EnhancedJournalModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        journal={currentJournal}
        userId={user.id}
      />

      {/* Floating Action Button untuk mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 btn-primary shadow-glow z-50 md:hidden rounded-full w-14 h-14 flex items-center justify-center"
        title="Write new entry"
      >
        <FiPlus size={24} />
      </button>
    </div>
  )
}