import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { FiTrendingUp, FiBook, FiTarget, FiCalendar, FiHeart, FiEdit3 } from 'react-icons/fi'

export default function DashboardStats({ userId }) {
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalWords: 0,
    currentStreak: 0,
    longestStreak: 0,
    thisMonthEntries: 0,
    favoriteEntries: 0,
    averageWordsPerEntry: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchStats()
    }
  }, [userId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Get basic stats
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)


      // Get this month's entries
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: monthlyEntries } = await supabase
        .from('journals')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())

      // Get favorite entries count
      const { data: favoriteEntries } = await supabase
        .from('journals')
        .select('id')
        .eq('user_id', userId)
        .eq('is_favorite', true)

      // Get all entries for calculations
      const { data: allEntries } = await supabase
        .from('journals')
        .select('word_count, created_at')
        .eq('user_id', userId)

      // Calculate streak
      const streak = calculateStreak(allEntries)
      
      setStats({
        totalEntries: userStats?.total_entries || allEntries?.length || 0,
        totalWords: userStats?.total_words || allEntries?.reduce((sum, entry) => sum + (entry.word_count || 0), 0) || 0,
        currentStreak: streak.current,
        longestStreak: Math.max(streak.longest, userStats?.longest_streak || 0),
        thisMonthEntries: monthlyEntries?.length || 0,
        favoriteEntries: favoriteEntries?.length || 0,
        averageWordsPerEntry: allEntries?.length ? Math.round((allEntries.reduce((sum, entry) => sum + (entry.word_count || 0), 0) / allEntries.length)) : 0
      })

    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (entries) => {
    if (!entries || entries.length === 0) return { current: 0, longest: 0 }

    // Sort entries by date
    const sortedDates = entries
      .map(entry => new Date(entry.created_at).toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(b) - new Date(a))

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date().toDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Check if today or yesterday has entry
    if (sortedDates[0] === today || sortedDates[0] === yesterday.toDateString()) {
      currentStreak = 1
      tempStreak = 1

      // Count consecutive days
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i-1])
        const nextDate = new Date(sortedDates[i])
        const diffTime = currentDate - nextDate
        const diffDays = diffTime / (1000 * 60 * 60 * 24)

        if (diffDays === 1) {
          currentStreak++
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak)
    
    return { current: currentStreak, longest: longestStreak }
  }

  const statCards = [
    {
      title: 'Total Entries',
      value: stats.totalEntries,
      icon: FiBook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      suffix: 'entries'
    },
    {
      title: 'Total Words',
      value: stats.totalWords.toLocaleString(),
      icon: FiEdit3,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      suffix: 'words'
    },
    {
      title: 'Current Streak',
      value: stats.currentStreak,
      icon: FiTrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      suffix: 'days'
    },
    {
      title: 'Longest Streak',
      value: stats.longestStreak,
      icon: FiTarget,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      suffix: 'days'
    },
    {
      title: 'This Month',
      value: stats.thisMonthEntries,
      icon: FiCalendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      suffix: 'entries'
    },
    {
      title: 'Favorites',
      value: stats.favoriteEntries,
      icon: FiHeart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      suffix: 'entries'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card-glass animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div 
          key={stat.title} 
          className="card-glass hover-lift animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`${stat.color}`} size={20} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${stat.color} mb-1`}>
            {stat.value}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {stat.title}
          </div>
          {stat.suffix && (
            <div className="text-xs text-gray-400 mt-1">
              {stat.suffix}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}