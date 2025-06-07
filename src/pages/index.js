import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import {
  FiHome, FiEdit, FiTrash2, FiPlus, FiHeart, FiStar, FiBookmark, FiClock,
  FiTrendingUp, FiGrid, FiList, FiFilter, FiSearch
} from 'react-icons/fi'
import ExportButton from '../components/ExportButton'
import DashboardStats from '../components/DashboardStats'
import SearchFilter from '../components/SearchFilter'
import QuickNotes from '../components/QuickNotes'
import MoodTracker from '../components/MoodTracker'
import JournalStreaks from '../components/JournalStreaks'
import TodoProgressAndList from '../components/TodoProgressAndList'
import EnhancedJournalModal from '../components/EnhancedJournalModal'
import LoadingSpinner from '../components/LoadingSpinner'

const moodEmojis = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  calm: '😌',
  angry: '😠',
  grateful: '🙏',
  anxious: '😰',
  motivated: '💪'
}

const tagColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-pink-100', 'bg-purple-100']

export default function JournalHome() {
  const { user } = useAuth()
  const [journals, setJournals] = useState([])
  const [filteredJournals, setFilteredJournals] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentJournal, setCurrentJournal] = useState(null)
  const [view, setView] = useState('grid')
  const [todos, setTodos] = useState([])
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedTags: [],
    dateRange: null,
    showFavoritesOnly: false,
    moodFilter: ''
  })

  // Fetch journals with memoization
  const fetchJournals = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      let query = supabase
        .from('journal_entries_with_tags')
        .select('*')
        .eq('user_id', user.id)

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'alphabetical':
          query = query.order('title', { ascending: true })
          break
        case 'word_count':
          query = query.order('word_count', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      const processedData = data?.map(journal => ({
        ...journal,
        tags: journal.tags || [],
        word_count: journal.word_count || (journal.content ? journal.content.trim().split(/\s+/).length : 0),
        reading_time: journal.reading_time || (journal.content ? Math.ceil(journal.content.trim().split(/\s+/).length / 200) : 1)
      })) || []

      setJournals(processedData)
      extractUniqueTags(processedData)
    } catch (error) {
      console.error('Error fetching journals:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }, [user, sortBy])

  // Extract unique tags
  const extractUniqueTags = (journalData) => {
    const tags = new Set()
    journalData.forEach(journal => {
      if (journal.tags && Array.isArray(journal.tags)) {
        journal.tags.forEach(tag => tags.add(tag))
      }
    })
    setAllTags(Array.from(tags))
  }

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...journals]

    if (filters.searchTerm) {
      filtered = filtered.filter(j =>
        j.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        j.content?.toLowerCase().includes(filters.searchTerm.toLowerCase())
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

    setFilteredJournals(filtered)
  }, [journals, filters])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Memoized statistics
  const stats = useMemo(() => {
    const totalWords = journals.reduce((total, journal) => total + (journal.word_count || 0), 0)
    const favoriteCount = journals.filter(journal => journal.is_favorite).length
    return { totalWords, favoriteCount }
  }, [journals])

  // Effects
  useEffect(() => {
    if (user) fetchJournals()
  }, [user, fetchJournals])

  useEffect(() => {
    applyFilters()
  }, [applyFilters, journals])

  // Journal operations
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

  const handleModalClose = () => {
    setIsModalOpen(false)
    setCurrentJournal(null)
    fetchJournals()
  }

  // Helper functions
  const formatReadingTime = (minutes) => {
    if (!minutes || minutes <= 0) return ''
    return `${minutes} min read`
  }

  const getTagColor = (index) => {
    return tagColors[index % tagColors.length]
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-16 px-4 max-w-md mx-auto">
          <div className="mb-8">
            <FiHeart className="mx-auto text-6xl text-pink-500 mb-4" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-6">
            Welcome to MyJournal
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your personal space for thoughts, dreams, and memories.
          </p>
          <div className="flex flex-col gap-4">
            <Link 
              href="/login" 
              className="btn-primary flex items-center justify-center gap-2"
            >
              <FiHome /> Sign In to Continue
            </Link>
            <Link 
              href="/signup" 
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <FiStar /> Create New Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <DashboardStats 
          userId={user.id} 
          totalEntries={journals.length}
          totalWords={stats.totalWords}
          favoriteCount={stats.favoriteCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  My Journal Entries
                </h1>
                <p className="text-gray-600">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiPlus /> New Entry
                </button>
                <ExportButton journals={journals} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <MoodTracker userId={user.id} />
              <JournalStreaks userId={user.id} />
            </div>

            <div className="mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FiSearch className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search journals..."
                    className="flex-1 outline-none"
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                  />
                  <FiFilter className="text-gray-400" />
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filters.moodFilter}
                    onChange={(e) => handleFilterChange({ moodFilter: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  >
                    <option value="">All Moods</option>
                    {Object.entries(moodEmojis).map(([value, emoji]) => (
                      <option key={value} value={value}>
                        {emoji} {value.charAt(0).toUpperCase() + value.slice(1)}
                      </option>
                    ))}
                  </select>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.showFavoritesOnly}
                      onChange={(e) => handleFilterChange({ showFavoritesOnly: e.target.checked })}
                      className="rounded text-pink-500"
                    />
                    Favorites Only
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {filteredJournals.length} of {journals.length} entries
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border rounded-lg px-3 py-2"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">A-Z</option>
                  <option value="favorites">Favorites First</option>
                  <option value="word_count">Most Words</option>
                </select>

                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 rounded-md ${view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                    title="Grid View"
                  >
                    <FiGrid size={16} />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded-md ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                    title="List View"
                  >
                    <FiList size={16} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : filteredJournals.length === 0 ? (
              <div className="text-center py-20">
                <div className="mb-6">
                  <FiEdit className="mx-auto text-5xl text-blue-500 mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {journals.length === 0 ? 'Your Journal Awaits!' : 'No entries match your filters'}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {journals.length === 0 
                    ? 'Create your first journal entry and begin your amazing journey!'
                    : 'Try adjusting your search or filter criteria to find more entries.'
                  }
                </p>
                {journals.length === 0 && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2 mx-auto"
                  >
                    <FiPlus /> Write Your First Entry
                  </button>
                )}
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJournals.map((journal) => (
                  <JournalCard 
                    key={journal.id}
                    journal={journal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                    getTagColor={getTagColor}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJournals.map((journal) => (
                  <JournalListCard
                    key={journal.id}
                    journal={journal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                    getTagColor={getTagColor}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <QuickNotes userId={user.id} />
            <TodoProgressAndList todos={todos} setTodos={setTodos} />
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiTrendingUp />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Entries</span>
                  <span className="font-semibold">{journals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Favorites</span>
                  <span className="font-semibold">{stats.favoriteCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Words</span>
                  <span className="font-semibold">{stats.totalWords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tags Used</span>
                  <span className="font-semibold">{allTags.length}</span>
                </div>
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiBookmark />
                  Your Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag, index) => (
                    <button
                      key={tag}
                      onClick={() => handleFilterChange({ selectedTags: [tag] })}
                      className={`${getTagColor(index)} px-3 py-1 rounded-full text-xs hover:opacity-80`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <EnhancedJournalModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          userId={user.id}
          journal={currentJournal}
        />

        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors md:hidden"
          aria-label="New entry"
        >
          <FiPlus size={24} />
        </button>
      </div>
    </div>
  )
}

// Journal Card Component
function JournalCard({ journal, onEdit, onDelete, onToggleFavorite, getTagColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
              {journal.title}
            </h2>
            {journal.mood && (
              <span className="text-xl" title={journal.mood}>
                {moodEmojis[journal.mood]}
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 gap-3 flex-wrap">
            <span>
              {new Date(journal.created_at).toLocaleDateString()}
            </span>
            {journal.word_count > 0 && (
              <span className="flex items-center gap-1">
                <FiEdit size={12} />
                {journal.word_count.toLocaleString()} words
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => onToggleFavorite(journal)}
            className={`p-1 rounded-full ${journal.is_favorite ? 'text-pink-500' : 'text-gray-400'}`}
            aria-label={journal.is_favorite ? 'Remove favorite' : 'Add favorite'}
          >
            <FiHeart size={16} className={journal.is_favorite ? 'fill-current' : ''} />
          </button>
        </div>
      </div>
      
      <div className="prose max-w-none mb-4 flex-1">
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line line-clamp-3">
          {journal.content}
        </p>
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          {journal.tags?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {journal.tags.map((tag, index) => (
                <span
                  key={tag}
                  className={`${getTagColor(index)} px-2 py-1 rounded-full text-xs`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400">No tags</div>
          )}
          
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(journal)}
              className="p-1 text-gray-500 hover:text-blue-600"
              aria-label="Edit entry"
            >
              <FiEdit size={16} />
            </button>
            <button
              onClick={() => onDelete(journal.id)}
              className="p-1 text-gray-500 hover:text-red-600"
              aria-label="Delete entry"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Journal List Card Component
function JournalListCard({ journal, onEdit, onDelete, onToggleFavorite, getTagColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-gray-800">
              {journal.title}
            </h2>
            {journal.mood && (
              <span className="text-xl" title={journal.mood}>
                {moodEmojis[journal.mood]}
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 gap-3 mb-2">
            <span>
              {new Date(journal.created_at).toLocaleDateString()}
            </span>
            {journal.word_count > 0 && (
              <span className="flex items-center gap-1">
                <FiEdit size={12} />
                {journal.word_count.toLocaleString()} words
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onToggleFavorite(journal)}
            className={`p-1 rounded-full ${journal.is_favorite ? 'text-pink-500' : 'text-gray-400'}`}
          >
            <FiHeart size={16} className={journal.is_favorite ? 'fill-current' : ''} />
          </button>
          <button
            onClick={() => onEdit(journal)}
            className="p-1 text-gray-500 hover:text-blue-600"
          >
            <FiEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(journal.id)}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="prose max-w-none mb-3">
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line line-clamp-2">
          {journal.content}
        </p>
      </div>
      
      {journal.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-3 border-t border-gray-100">
          {journal.tags.map((tag, index) => (
            <span
              key={tag}
              className={`${getTagColor(index)} px-2 py-1 rounded-full text-xs`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}