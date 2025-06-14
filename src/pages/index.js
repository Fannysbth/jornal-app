import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import {
  FiHome, FiEdit, FiTrash2, FiPlus, FiHeart, FiStar, FiBookmark, FiClock,
  FiTrendingUp, FiGrid, FiList, FiFilter, FiSearch, FiEye
} from 'react-icons/fi'
import ExportButton from '../components/ExportButton'
import DashboardStats from '../components/DashboardStats'
import QuickNotes from '../components/QuickNotes'
import MoodTracker from '../components/MoodTracker'
import JournalStreaks from '../components/JournalStreaks'
import TodoProgressAndList from '../components/TodoProgressAndList'
import EnhancedJournalModal from '../components/EnhancedJournalModal'
import LoadingSpinner from '../components/LoadingSpinner'
import Image from 'next/image'


const tagColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-pink-100', 'bg-purple-100']
const moodEmojis = {
  happy: { emoji: '😊', label: 'Happy', color: 'bg-yellow-100 text-yellow-600' },
  sad: { emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-600' },
  excited: { emoji: '🤩', label: 'Excited', color: 'bg-orange-100 text-orange-600' },
  calm: { emoji: '😌', label: 'Calm', color: 'bg-green-100 text-green-600' },
  angry: { emoji: '😠', label: 'Angry', color: 'bg-red-100 text-red-600' },
  grateful: { emoji: '🙏', label: 'Grateful', color: 'bg-purple-100 text-purple-600' },
  anxious: { emoji: '😰', label: 'Anxious', color: 'bg-gray-100 text-gray-600' },
  motivated: { emoji: '💪', label: 'Motivated', color: 'bg-indigo-100 text-indigo-600' }
}
export default function JournalHome() {
  const { user } = useAuth()
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [journals, setJournals] = useState([])
  const [filteredJournals, setFilteredJournals] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentJournal, setCurrentJournal] = useState(null)
  const [view, setView] = useState('grid')
  const [modalMode, setModalMode] = useState("view");
  const [todos, setTodos] = useState([])
  const [sortBy, setSortBy] = useState('newest')
  const [mode, setMode] = useState('create') 

  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedTags: [],
    dateRange: null,
    showFavoritesOnly: false,
    moodFilter: ''
  })

  const fetchJournals = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      let query = supabase
        .from('journal_entries_with_tags')
        .select('*')
        .eq('user_id', user.id)

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

  const extractUniqueTags = (journalData) => {
    const tags = new Set()
    journalData.forEach(journal => {
      if (journal.tags && Array.isArray(journal.tags)) {
        journal.tags.forEach(tag => tags.add(tag))
      }
    })
    setAllTags(Array.from(tags))
  }

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

  const openDetailModal = (journal) => {
    setCurrentJournal(journal)
    setMode('view')
    setIsModalOpen(true)
  };
 
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const stats = useMemo(() => {
    const totalWords = journals.reduce((total, journal) => total + (journal.word_count || 0), 0)
    const favoriteCount = journals.filter(journal => journal.is_favorite).length
    return { totalWords, favoriteCount }
  }, [journals])

  useEffect(() => {
    if (user) fetchJournals()
  }, [user, fetchJournals])

  useEffect(() => {
    applyFilters()
  }, [applyFilters, journals])

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
    setMode('edit')
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

  const getTagColor = (index) => {
    return tagColors[index % tagColors.length]
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center py-16 px-4 max-w-md mx-auto">
          <div className="mb-8">
            <Image src="/logo.png" alt="MyJournal Logo" width={200} height={200} className="rounded-full mx-auto mb-4" />
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJournals.map((journal) => (
                  <JournalCard 
                    key={journal.id}
                    journal={journal}
                    onEdit={handleEdit}
                    onView={openDetailModal} 
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                    getTagColor={getTagColor}
                  />
                ))}
              </div>)}
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
                  {allTags.map((tagRaw, index) => {
                  const tag = typeof tagRaw === 'string' ? JSON.parse(tagRaw) : tagRaw;
                  return(
                    <button
                      key={tag.id || tag.name || index}
                      onClick={() => handleFilterChange({ selectedTags: [tag] })}
                      className={`${getTagColor(index)} px-3 py-1 rounded-full text-xs hover:opacity-80`}
                    >
                      #{tag.name}
                    </button>
                  )})}
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
          mode={mode}
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

function JournalCard({ journal, onEdit, onDelete, onToggleFavorite, getTagColor, onView, readOnly = false }) {
  console.log('Journal:', journal);
  console.log('Journal content:', journal.content);

  return (
    <div className="card-glass hover-lift p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-gradient-primary line-clamp-2">
              {journal.title}
            </h2>
            {journal.mood && (
              <span className="text-xl" title={journal.mood}>
                <span>{moodEmojis[journal.mood]?.emoji}</span>
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 gap-3 flex-wrap">
            <span>{new Date(journal.created_at).toLocaleDateString()}</span>
            {journal.word_count > 0 && (
              <span className="flex items-center gap-1">
                <FiEdit size={12} />
                {journal.word_count.toLocaleString()} words
              </span>
            )}
          </div>
        </div>

        {!readOnly && (
          <button
            onClick={() => onToggleFavorite(journal)}
            className={`p-1 rounded-full ${journal.is_favorite ? 'text-pink-500' : 'text-gray-400'}`}
            aria-label={journal.is_favorite ? 'Remove favorite' : 'Add favorite'}
          >
            <FiHeart size={16} className={journal.is_favorite ? 'fill-current' : ''} />
          </button>
        )}
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
                  key={tag.id|| index}
                  className={`tag-blue ${getTagColor(index)} px-2 py-1 rounded-full text-xs`}
                >#{tag.name}
                </span> 
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400">No tags</div>
          )}

          {!readOnly && (
            <div className="flex gap-1">
              <button
                onClick={() => onView(journal)}
                className="btn-neutral hover-scale p-1 text-gray-500"
                aria-label="View entry"
              >
                <FiEye size={16} />
              </button>
              <button
                onClick={() => onEdit(journal)}
                className="btn-secondary hover-scale p-1 text-gray-500"
                aria-label="Edit entry"
              >
                <FiEdit size={16} />
              </button>
              <button
                onClick={() => onDelete(journal.id)}
                className="btn-accent hover-glow p-1 text-gray-500"
                aria-label="Delete entry"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
