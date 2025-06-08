import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { FiTrendingUp, FiCalendar, FiSun, FiMoon } from 'react-icons/fi'

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


export default function MoodTracker({ userId }) {
  const [moodData, setMoodData] = useState([])
  const [selectedMood, setSelectedMood] = useState(null)
  const [moodStats, setMoodStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week') // week, month, year

  useEffect(() => {
    if (userId) {
      fetchMoodData()
    }
  }, [userId, timeRange])

  const fetchMoodData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      const { data, error } = await supabase
        .from('journals')
        .select('mood, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .not('mood', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMoodData(data || [])
      calculateMoodStats(data || [])
      
    } catch (error) {
      console.error('Error fetching mood data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMoodStats = (data) => {
    const stats = {}
    const total = data.length
    
    // Count each mood
    data.forEach(entry => {
      stats[entry.mood] = (stats[entry.mood] || 0) + 1
    })
    
    // Convert to percentages
    Object.keys(stats).forEach(mood => {
      stats[mood] = {
        count: stats[mood],
        percentage: total > 0 ? Math.round((stats[mood] / total) * 100) : 0
      }
    })
    
    setMoodStats(stats)
  }

  const getMoodTrend = () => {
    if (moodData.length < 2) return null
    
    // Simple trend calculation based on recent vs older entries
    const recent = moodData.slice(0, Math.ceil(moodData.length / 2))
    const older = moodData.slice(Math.ceil(moodData.length / 2))
    
    const positiveMoods = ['happy', 'excited', 'calm', 'grateful', 'motivated']
    
    const recentPositive = recent.filter(entry => positiveMoods.includes(entry.mood)).length
    const olderPositive = older.filter(entry => positiveMoods.includes(entry.mood)).length
    
    const recentRatio = recent.length > 0 ? recentPositive / recent.length : 0
    const olderRatio = older.length > 0 ? olderPositive / older.length : 0
    
    if (recentRatio > olderRatio) return 'improving'
    if (recentRatio < olderRatio) return 'declining'
    return 'stable'
  }

  const getMostFrequentMood = () => {
    if (Object.keys(moodStats).length === 0) return null
    
    return Object.entries(moodStats).reduce((max, [mood, data]) => 
      data.count > (moodStats[max]?.count || 0) ? mood : max
    )
  }

  const trend = getMoodTrend()
  const topMood = getMostFrequentMood()

  if (loading) {
    return (
      <div className="card-glass">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-glass">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gradient-primary flex items-center">
          <FiTrendingUp className="mr-2" />
          Mood Tracker
        </h3>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {moodData.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">No mood data for this period</p>
          <p className="text-sm text-gray-400 mt-1">Add moods to your journal entries to see trends!</p>
        </div>
      ) : (
        <>
          {/* Mood Overview */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{moodData.length}</div>
              <div className="text-sm text-blue-500">Total Entries</div>
            </div>
            
            {topMood && (
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                <div className="text-2xl mb-1">{moodEmojis[topMood]?.emoji}</div>
                <div className="text-xs text-green-600 font-medium">Most Frequent</div>
              </div>
            )}
          </div>

          {/* Mood Trend */}
          {trend && (
            <div className={`p-4 rounded-lg mb-6 flex items-center ${
              trend === 'improving' ? 'bg-green-50 text-green-700' :
              trend === 'declining' ? 'bg-red-50 text-red-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {trend === 'improving' ? <FiSun className="mr-2" /> : 
               trend === 'declining' ? <FiMoon className="mr-2" /> : 
               <FiCalendar className="mr-2" />}
              <span className="text-sm font-medium">
                Your mood trend is {' '}
                <span className="font-bold">
                  {trend === 'improving' ? '📈 improving' : 
                   trend === 'declining' ? '📉 needs attention' : 
                   '➡️ stable'}
                </span>
              </span>
            </div>
          )}

          {/* Mood Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 mb-3">Mood Distribution</h4>
            {Object.entries(moodStats)
              .sort(([,a], [,b]) => b.count - a.count)
              .map(([mood, data]) => (
                <div key={mood} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{moodEmojis[mood]?.emoji}</span>
                    <div>
                      <div className="font-medium text-gray-700">{moodEmojis[mood]?.label}</div>
                      <div className="text-sm text-gray-500">{data.count} entries</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full ${moodEmojis[mood]?.color.replace('text-', 'bg-').replace('-600', '-500')}`}
                        style={{ width: `${data.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-right">
                      {data.percentage}%
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Recent Moods Timeline */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="font-medium text-gray-700 mb-3">Recent Moods</h4>
            <div className="flex flex-wrap gap-2">
              {moodData.slice(0, 10).map((entry, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  title={`${moodEmojis[entry.mood]?.label} - ${new Date(entry.created_at).toLocaleDateString()}`}
                >
                  <span className="text-lg">{moodEmojis[entry.mood]?.emoji}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(entry.created_at).toLocaleDateString('id-ID', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}