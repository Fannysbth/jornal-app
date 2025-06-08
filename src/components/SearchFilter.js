import { useState, useEffect } from 'react'
import { FiSearch, FiFilter, FiX, FiCalendar, FiTag, FiHeart } from 'react-icons/fi'

export default function SearchFilter({ onFilter, tags = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [moodFilter, setMoodFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const moods = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'sad', emoji: '😢', label: 'Sad' },
    { value: 'excited', emoji: '🤩', label: 'Excited' },
    { value: 'calm', emoji: '😌', label: 'Calm' },
    { value: 'angry', emoji: '😠', label: 'Angry' },
    { value: 'grateful', emoji: '🙏', label: 'Grateful' },
    { value: 'anxious', emoji: '😰', label: 'Anxious' },
    { value: 'motivated', emoji: '💪', label: 'Motivated' }
  ]

  useEffect(() => {
    const filters = {
      searchTerm: searchTerm.trim(),
      selectedTags,
      dateRange,
      showFavoritesOnly,
      moodFilter
    }
    onFilter(filters)
  }, [searchTerm, selectedTags, dateRange, showFavoritesOnly, moodFilter, onFilter])

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
    setDateRange({ start: '', end: '' })
    setShowFavoritesOnly(false)
    setMoodFilter('')
  }

  const hasActiveFilters = searchTerm || selectedTags.length > 0 || dateRange.start || dateRange.end || showFavoritesOnly || moodFilter

  return (
    <div className="card-glass mb-6">
  {/* Search Bar */}
  <div className="relative mb-6">
    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
    <input
      type="text"
      placeholder="Search your journals..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-12 pr-4 py-3 input-glass focus:ring-blue-400"
    />
  </div>

  {/* Filter Toggle & Clear */}
  <div className="flex justify-between items-center mb-6">
    <button
      onClick={() => setShowFilters(!showFilters)}
      className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition-all duration-300 ${
        showFilters ? 'bg-gradient-primary text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <FiFilter size={16} />
      Filters
      {hasActiveFilters && (
        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2 shadow-glow">
          {[searchTerm && 1, selectedTags.length, (dateRange.start || dateRange.end) && 1, showFavoritesOnly && 1, moodFilter && 1].filter(Boolean).reduce((a, b) => a + b, 0)}
        </span>
      )}
    </button>

    {hasActiveFilters && (
      <button
        onClick={clearAllFilters}
        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
      >
        <FiX size={16} />
        Clear All
      </button>
    )}
  </div>

  {/* Advanced Filters */}
  {showFilters && (
    <div className="space-y-6 pt-6 border-t border-gray-200 animate-fade-in">
      
      {/* Date Range */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <FiCalendar size={16} />
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">From</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="input-glass text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">To</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="input-glass text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tags Filter */}
      {tags.length > 0 && (
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <FiTag size={16} />
            Tags
          </label>
          <div className="flex flex-wrap gap-3">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag)}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedTags.includes(tag)
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mood Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          😊 Mood
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {moods.map(mood => (
            <button
              key={mood.value}
              onClick={() => setMoodFilter(moodFilter === mood.value ? '' : mood.value)}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-300 flex flex-col items-center gap-1 ${
                moodFilter === mood.value
                  ? 'bg-gradient-warm text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              title={mood.label}
            >
              <span className="text-xl">{mood.emoji}</span>
              <span className="text-xs hidden sm:block">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
            className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
          />
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FiHeart size={18} className="text-pink-500" />
            Show favorites only
          </span>
        </label>
      </div>
    </div>
  )}
</div>
)
}