import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { FiZap, FiCalendar, FiTarget } from 'react-icons/fi'

export default function JournalStreaks({ userId }) {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    weeklyGoal: 3,
    thisWeekCount: 0,
  })
  const [recentDays, setRecentDays] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      calculateStreaks()
    }
  }, [userId])

  const calculateStreaks = async () => {
    try {
      setLoading(true)

      // Ambil semua entry user dari tabel journals
      const { data, error } = await supabase
        .from('journals')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const entries = data || []

      // Ambil tanggal unik tanpa jam
      const uniqueDates = [
        ...new Set(
          entries.map((entry) => new Date(entry.created_at).toDateString())
        ),
      ].sort((a, b) => new Date(b) - new Date(a))

      // Hitung current streak
      let currentStreak = 0
      const today = new Date()
      let checkDate = new Date(today)

      const todayStr = today.toDateString()
      const yesterdayStr = new Date(today.getTime() - 86400000).toDateString()

      if (uniqueDates.includes(todayStr)) {
        currentStreak = 1
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (uniqueDates.includes(yesterdayStr)) {
        currentStreak = 1
        checkDate = new Date(today.getTime() - 86400000)
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        currentStreak = 0
      }

      while (currentStreak > 0 && uniqueDates.includes(checkDate.toDateString())) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }

      // Hitung longest streak
      let longestStreak = 0
      let tempStreak = 0
      let prevDate = null

      for (const dateStr of [...uniqueDates].reverse()) {
        const currentDate = new Date(dateStr)

        if (!prevDate) {
          tempStreak = 1
        } else {
          const dayDiff =
            (currentDate - prevDate) / (1000 * 60 * 60 * 24) // Selisih hari
          if (dayDiff === 1) {
            tempStreak++
          } else {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        }
        prevDate = currentDate
      }
      longestStreak = Math.max(longestStreak, tempStreak)

      // Hitung jumlah entry minggu ini
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const thisWeekEntries = entries.filter(
        (entry) => new Date(entry.created_at) >= startOfWeek
      )
      const thisWeekUniqueDays = new Set(
        thisWeekEntries.map((entry) =>
          new Date(entry.created_at).toDateString()
        )
      ).size

      // Buat data 30 hari terakhir untuk calendar
      const recent30Days = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toDateString()
        recent30Days.push({
          date,
          hasEntry: uniqueDates.includes(dateStr),
          isToday: i === 0,
          dayOfWeek: date.getDay(),
        })
      }

      setStreakData({
        currentStreak,
        longestStreak,
        totalDays: uniqueDates.length,
        weeklyGoal: 3, // Bisa diubah jika ingin
        thisWeekCount: thisWeekUniqueDays,
      })

      setRecentDays(recent30Days)
    } catch (error) {
      console.error('Error calculating streaks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Emoji untuk streak
  const getStreakEmoji = (streak) => {
    if (streak === 0) return '📝'
    if (streak < 3) return '🔥'
    if (streak < 7) return '🚀'
    if (streak < 14) return '⭐'
    if (streak < 30) return '💎'
    return '🏆'
  }

  // Pesan motivasi berdasarkan streak
  const getMotivationalMessage = () => {
    const { currentStreak, longestStreak } = streakData

    if (currentStreak === 0) {
      return "Ready to start a new streak? Write your first entry today! 💪"
    }
    if (currentStreak === 1) {
      return "Great start! Keep the momentum going! 🌟"
    }
    if (currentStreak < 7) {
      return `${currentStreak} days strong! You're building a great habit! 🔥`
    }
    if (currentStreak < 14) {
      return `Amazing! ${currentStreak} days in a row! You're on fire! 🚀`
    }
    if (currentStreak === longestStreak && currentStreak >= 7) {
      return `Personal best! ${currentStreak} days - you're crushing it! 🏆`
    }
    return `Incredible dedication! ${currentStreak} days straight! 💎`
  }

  const weeklyProgress = Math.min(
    (streakData.thisWeekCount / streakData.weeklyGoal) * 100,
    100
  )

  if (loading) {
    return (
      <div className="card-glass">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass">
      <h3 className="text-lg font-semibold text-gradient-primary mb-4 flex items-center gap-2">
        <FiZap />
        Writing Streaks
      </h3>

      <div className="text-center mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
        <div className="text-4xl mb-2">{getStreakEmoji(streakData.currentStreak)}</div>
        <div className="text-2xl font-bold text-orange-600 mb-1">
          {streakData.currentStreak}
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {streakData.currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
        </p>
        <p className="text-xs text-orange-700 font-medium">
          {getMotivationalMessage()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-xl font-bold text-blue-600 mb-1">{streakData.longestStreak}</div>
          <p className="text-xs text-blue-700">Longest Streak</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="text-xl font-bold text-green-600 mb-1">{streakData.totalDays}</div>
          <p className="text-xs text-green-700">Total Writing Days</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FiTarget size={14} />
            Weekly Goal
          </span>
          <span className="text-sm text-gray-600">
            {streakData.thisWeekCount}/{streakData.weeklyGoal}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {weeklyProgress >= 100
            ? '🎉 Goal achieved this week!'
            : `${Math.ceil(streakData.weeklyGoal - streakData.thisWeekCount)} more days to reach your goal`}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FiCalendar size={14} />
          Last 30 Days
        </p>
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div
              key={index}
              className="text-center text-xs text-gray-400 mb-1 font-medium"
            >
              {day}
            </div>
          ))}

          {/* Kosongkan slot sebelum hari pertama bulan */}
          {Array.from({ length: recentDays[0]?.dayOfWeek || 0 }, (_, i) => (
            <div key={`empty-${i}`} className="w-4 h-4"></div>
          ))}

          {recentDays.map((day, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-sm border border-gray-200 transition-all duration-200 ${
                day.hasEntry
                  ? day.isToday
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 border-orange-400 shadow-sm'
                    : 'bg-gradient-to-br from-green-400 to-blue-500 border-green-400'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={`${day.date.toLocaleDateString()} ${
                day.hasEntry ? '- Journal entry' : '- No entry'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 bg-gray-100 rounded-sm border border-gray-200"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm border border-green-300"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm border border-green-400"></div>
            <div className="w-3 h-3 bg-green-600 rounded-sm border border-green-500"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          💡 Tip: Write just a few sentences daily to maintain your streak!
        </p>
      </div>
    </div>
  )
}
