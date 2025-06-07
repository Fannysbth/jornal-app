import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  FiHome, FiEdit, FiTrash2, FiPlus, FiHeart, FiStar, FiBookmark, FiClock,
  FiTrendingUp, FiGrid, FiList, FiFilter, FiSearch
} from 'react-icons/fi'
import ExportButton from '../components/ExportButton'
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

export default function FavoritesPage() {
  const { user } = useAuth()
  const [journals, setJournals] = useState([])
  const [filteredJournals, setFilteredJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentJournal, setCurrentJournal] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState({
    searchTerm: '',
    moodFilter: ''
  })
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(true) // <-- state baru

  const fetchJournals = useCallback(async (favoritesOnly) => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('journal_entries_with_tags')
        .select('*')
        .eq('user_id', user.id)

      if (favoritesOnly) {
        query = query.eq('is_favorite', true)
      }

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
      applyFilters(processedData)
    } catch (error) {
      console.error('Error fetching journals:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }, [user, sortBy])

  const applyFilters = useCallback((journalData) => {
    let filtered = [...journalData]

    if (filters.searchTerm) {
      filtered = filtered.filter(j =>
        j.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        j.content?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    if (filters.moodFilter) {
      filtered = filtered.filter(j => j.mood === filters.moodFilter)
    }

    setFilteredJournals(filtered)
  }, [filters.searchTerm, filters.moodFilter])

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    applyFilters(journals)
  }, [applyFilters, journals])

  // Panggil fetchJournals tiap showFavoritesOnly atau sortBy berubah
  useEffect(() => {
    if (user) fetchJournals(showFavoritesOnly)
  }, [user, fetchJournals, showFavoritesOnly, sortBy])

  // UI toggle favorite/all
  const toggleShowFavorites = () => {
    setShowFavoritesOnly(prev => !prev)
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
      fetchJournals() // Refresh the list after toggling favorite
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-16 px-4 max-w-md mx-auto">
          <div className="mb-8">
            <FiHeart className="mx-auto text-6xl text-pink-500 mb-4" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            My Favorites
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Please sign in to view your favorite journal entries.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FiStar className="text-yellow-500" />
              {showFavoritesOnly ? 'My Favorite Entries' : 'All Journal Entries'}
            </h1>
            <p className="text-gray-600">
              {filteredJournals.length} {showFavoritesOnly ? 'favorite' : 'journal'} {filteredJournals.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          
          <div className="flex gap-3 items-center">
            <button
  onClick={toggleShowFavorites}
  className={`text-sm font-semibold px-3 py-1 rounded-lg border flex items-center gap-1
    ${showFavoritesOnly
      ? 'bg-pink-100 border-pink-400 text-pink-700'
      : 'bg-white border-gray-300 text-gray-700'}`}
>
  <FiHeart className={showFavoritesOnly ? 'text-pink-500' : 'text-gray-400'} />
  {showFavoritesOnly ? 'Show All' : 'Show Favorites'}
</button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">A-Z</option>
              <option value="word_count">Most Words</option>
            </select>
          </div>

          <div className="flex gap-3">
              <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2">
              <FiPlus /> New Entry
              </button>
              <ExportButton journals={journals} />
          </div>
        </div>

        {/* Filter search + mood tetap sama */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <FiFilter className="text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${showFavoritesOnly ? 'favorites' : 'journals'}...`}
                    className="flex-1 outline-none text-sm"
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <select
                  value={filters.moodFilter}
                  onChange={(e) => handleFilterChange({ moodFilter: e.target.value })}
                  className="text-sm border rounded-lg px-3 py-2 w-full"
                >
                  <option value="">All Moods</option>
                  {Object.entries(moodEmojis).map(([value, emoji]) => (
                    <option key={value} value={value}>
                      {emoji} {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List atau spinner */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredJournals.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <FiHeart className="mx-auto text-5xl text-pink-500 mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {journals.length === 0 
                ? 'No Entries Yet' 
                : `No ${showFavoritesOnly ? 'favorites' : 'entries'} match your filters`}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {journals.length === 0 
                ? 'Start writing journals to see them appear here!'
                : 'Try adjusting your search or mood filter to find more entries.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJournals.map((journal) => (
              <JournalCard 
                key={journal.id}
                journal={journal}
                onEdit={handleEdit}
                onToggleFavorite={toggleFavorite}
                getTagColor={getTagColor}
              />
            ))}
          </div>
        )}

        <EnhancedJournalModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          userId={user.id}
          journal={currentJournal}
        />
      </div>
    </div>
  )
}


function JournalCard({ journal, onEdit, onToggleFavorite, getTagColor }) {
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
                {journal.word_count.toLocaleString()} words
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
  <button
    onClick={() => onToggleFavorite(journal)}
    className={`p-1 rounded-full ${journal.is_favorite ? 'text-pink-500' : 'text-gray-400'}`}
    aria-label={journal.is_favorite ? "Remove favorite" : "Add favorite"}
  >
    <FiHeart size={16} className="fill-current" />
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
          
          <button
            onClick={() => onEdit(journal)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}