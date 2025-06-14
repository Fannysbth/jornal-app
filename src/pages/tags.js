import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  FiHome, FiEye, FiEdit, FiTrash2, FiPlus, FiHeart, FiStar, FiBookmark, FiClock,
  FiTrendingUp, FiGrid, FiList, FiFilter, FiSearch
} from 'react-icons/fi'
import ExportButton from '../components/ExportButton'
import EnhancedJournalModal from '../components/EnhancedJournalModal'
import LoadingSpinner from '../components/LoadingSpinner'

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

const tagColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-pink-100', 'bg-purple-100']

export default function FavoritesPage() {
  const { user } = useAuth()
  const [journals, setJournals] = useState([])
  const [filteredJournals, setFilteredJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentJournal, setCurrentJournal] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
    const [view, setView] = useState('grid')
  const [mode, setMode] = useState('create')
  const [filters, setFilters] = useState({
    searchTerm: '',
    moodFilter: ''
  })
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false) 


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
  }, [])

  useEffect(() => {
  applyFilters(journals)
}, [filters, journals, applyFilters])


  useEffect(() => {
    if (user) fetchJournals(showFavoritesOnly)
  }, [user, fetchJournals, showFavoritesOnly, sortBy])

  const toggleShowFavorites = () => {
    setShowFavoritesOnly(prev => !prev)
  }

  const handleEdit = (journal) => {
    setCurrentJournal(journal)
    setIsModalOpen(true)
    setMode('edit')
  }

  const toggleFavorite = async (journal) => {
  try {
    const updatedFavorite = !journal.is_favorite
    const { error } = await supabase
      .from('journals')
      .update({ is_favorite: updatedFavorite })
      .eq('id', journal.id)

    if (error) throw error

    const updatedJournals = journals.map(j =>
      j.id === journal.id ? { ...j, is_favorite: updatedFavorite } : j
    )
    setJournals(updatedJournals)
    applyFilters(updatedJournals)
  } catch (error) {
    console.error('Error updating favorite:', error)
  }
}  

  const handleModalClose = () => {
    setIsModalOpen(false)
    setCurrentJournal(null)
    fetchJournals(showFavoritesOnly)
  }

  const getTagColor = (index) => {
    return tagColors[index % tagColors.length]
  }

   const handleDelete = async (id) => {
      if (!confirm('Are you sure you want to delete this journal entry?')) return
      try {
        const { error } = await supabase.from('journals').delete().eq('id', id)
        if (error) throw error
        fetchJournals(showFavoritesOnly)
      } catch (error) {
        alert(error.message)
      }
    }

  if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center py-16 px-4 max-w-md mx-auto">
        <div className="mb-8">
          <FiHeart className="mx-auto text-6xl text-pink-500 mb-4" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-2">
          My Favorites
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Please sign in to view your favorite journal entries.
        </p>
      </div>
    </div>
  )
}

 const openDetailModal = (journal) => {
  setCurrentJournal(journal)
  setMode('view')
  setIsModalOpen(true)
};

return (
  <div className="min-h-screen bg-gray-50">
    <div className="main-container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient-rainbow mb-2 flex items-center gap-2">
            <FiStar className="text-yellow-500" />
            {showFavoritesOnly ? 'My Favorite Entries' : 'All Journal Entries'}
          </h1>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={toggleShowFavorites}
            className={`btn-secondary hover-scale flex items-center gap-2 px-3 py-1 text-sm rounded-lg
              ${showFavoritesOnly ? 'bg-pink-100 text-pink-700 border-pink-400' : ''}`}
          >
            <FiHeart className={showFavoritesOnly ? 'text-pink-500' : 'text-gray-400'} />
            {showFavoritesOnly ? 'Show All' : 'Show Favorites'}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-glass text-sm rounded-lg"
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
            className="btn-primary hover-lift flex items-center gap-2"
          >
            <FiPlus /> New Entry
          </button>
          <ExportButton journals={journals} />
        </div>
      </div>

      <div className="mb-6">
        <div className="card-glass p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing {filteredJournals.length} of {journals.length} entries
          </div>
        </div>

        

            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <FiFilter className="text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${showFavoritesOnly ? 'favorites' : 'journals'}...`}
                  className="input-glass text-sm w-full"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-center items-center">
              <div className="min-w-[200px]">
              <select
                value={filters.moodFilter}
                onChange={(e) => handleFilterChange({ moodFilter: e.target.value })}
                className="input-glass text-sm w-full"
              >
                <option value="">All Moods</option>
                {Object.entries(moodEmojis).map(([value, emoji]) => (
                  <option key={value} value={value}>
                     {emoji.emoji} {emoji.label}
                  </option>
                ))}
              </select>
            </div>  
            </div>

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
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredJournals.length === 0 ? (
        <div className="text-center py-20">
          <FiHeart className="mx-auto text-5xl text-pink-500 mb-4" />
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
      ) : view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJournals.map((journal) => (
                  <JournalCard 
                    key={journal.id}
                    journal={journal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                    onView={openDetailModal} 
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
                    onView={openDetailModal} 
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
         mode={mode}
      />
    </div>
  </div>
)
}

function JournalCard({ journal, onEdit, onDelete, onToggleFavorite, getTagColor, onView, readOnly = false }) {
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
                  key={tag.id || tag.name || index}
                  className={`tag-blue ${getTagColor(index)} px-2 py-1 rounded-full text-xs`}
                >
                  #{tag.name}
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



function JournalListCard({ journal, onEdit, onDelete, onToggleFavorite, getTagColor, onView, readOnly = false }) {
  return (
    <div className="card-glass hover-lift p-6">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-gradient-primary">
              {journal.title}
            </h2>
            {journal.mood && (
              <span className="text-xl" title={journal.mood}>
                <span>{moodEmojis[journal.mood]?.emoji}</span>
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 gap-3 mb-2">
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
          <div className="flex gap-2">
            <button
              onClick={() => onToggleFavorite(journal)}
              className={`p-1 rounded-full ${journal.is_favorite ? 'text-pink-500' : 'text-gray-400'}`}
              aria-label={journal.is_favorite ? 'Unfavorite' : 'Favorite'}
            >
              <FiHeart size={16} className={journal.is_favorite ? 'fill-current' : ''} />
            </button>
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

      <div className="prose max-w-none mb-3">
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line line-clamp-2">
          {journal.content}
        </p>
      </div>

      {journal.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-3 border-t border-gray-100">
          {journal.tags.map((tagRaw, index) => {
                const tag = typeof tagRaw === 'string' ? JSON.parse(tagRaw) : tagRaw;
                return (
                <span
                  key={tag.id || tag.name || index}
                  className={`tag-blue ${getTagColor(index)} px-2 py-1 rounded-full text-xs`}
                >
                  #{tag.name}
                </span>
              )})}
        </div>
      )}
    </div>
  );
}

