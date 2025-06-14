import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FiDownload, FiFileText, FiFile, FiImage, FiCalendar, FiFilter } from 'react-icons/fi'

export default function ExportButton() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    format: 'json',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    includeTags: true,
    includeMood: true,
    includeStats: true,
    selectedTags: [],
    moodFilter: ''
  })
  const [availableTags, setAvailableTags] = useState([])

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: FiFile, description: 'Structured data format' },
    { value: 'txt', label: 'Text', icon: FiFileText, description: 'Plain text format' },
    { value: 'markdown', label: 'Markdown', icon: FiFileText, description: 'Markdown format' },
    { value: 'csv', label: 'CSV', icon: FiFile, description: 'Spreadsheet compatible' },
    { value: 'pdf', label: 'PDF', icon: FiFile, description: 'Portable document' }
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'All Entries' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const moodOptions = ['happy', 'sad', 'excited', 'calm', 'angry', 'grateful', 'anxious', 'motivated']

  const handleOpen = async () => {
    setIsOpen(true)
    try {
      const { data } = await supabase
        .from('journal_entries_with_tags')
        .select('tags')
        .eq('user_id', user.id)
      
      const tags = new Set()
      data?.forEach(entry => {
        entry.tags?.forEach(tag => tags.add(tag))
      })
      setAvailableTags(Array.from(tags))
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    let startDate = new Date(0) 
    let endDate = now

    switch (exportOptions.dateRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      case 'custom':
        startDate = exportOptions.startDate ? new Date(exportOptions.startDate) : new Date(0)
        endDate = exportOptions.endDate ? new Date(exportOptions.endDate) : now
        break
    }

    return { startDate, endDate }
  }

  const fetchJournalData = async () => {
    const { startDate, endDate } = getDateRange()
    
    let query = supabase
      .from('journal_entries_with_tags')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (exportOptions.moodFilter) {
      query = query.eq('mood', exportOptions.moodFilter)
    }

    const { data, error } = await query

    if (error) throw error

    let filteredData = data || []
    if (exportOptions.selectedTags.length > 0) {
      filteredData = filteredData.filter(entry =>
        entry.tags?.some(tag => exportOptions.selectedTags.includes(tag))
      )
    }

    return filteredData
  }

  const generateJSON = (data) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalEntries: data.length,
      user: user.email,
      options: exportOptions,
      entries: data.map(entry => ({
        id: entry.id,
        title: entry.title,
        content: entry.content,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        ...(exportOptions.includeTags && { tags: entry.tags }),
        ...(exportOptions.includeMood && { mood: entry.mood }),
        ...(exportOptions.includeStats && {
          word_count: entry.word_count,
          reading_time: entry.reading_time,
          is_favorite: entry.is_favorite
        })
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  const generateText = (data) => {
    let text = `My Journal Export\n`
    text += `Export Date: ${new Date().toLocaleString()}\n`
    text += `Total Entries: ${data.length}\n`
    text += `\n${'='.repeat(50)}\n\n`

    data.forEach((entry, index) => {
      text += `Entry ${index + 1}: ${entry.title}\n`
      text += `Date: ${new Date(entry.created_at).toLocaleString()}\n`
      
      if (exportOptions.includeMood && entry.mood) {
        text += `Mood: ${entry.mood}\n`
      }
      
      if (exportOptions.includeTags && entry.tags?.length > 0) {
        text += `Tags: ${entry.tags.join(', ')}\n`
      }
      
      text += `\n${entry.content}\n`
      text += `\n${'-'.repeat(30)}\n\n`
    })

    return text
  }

  const generateMarkdown = (data) => {
    let markdown = `# My Journal Export\n\n`
    markdown += `**Export Date:** ${new Date().toLocaleString()}  \n`
    markdown += `**Total Entries:** ${data.length}\n\n`
    markdown += `---\n\n`

    data.forEach((entry, index) => {
      markdown += `## ${entry.title}\n\n`
      markdown += `**Date:** ${new Date(entry.created_at).toLocaleString()}  \n`
      
      if (exportOptions.includeMood && entry.mood) {
        const moodEmojis = {
          happy: '😊', sad: '😢', excited: '🤩', calm: '😌',
          angry: '😠', grateful: '🙏', anxious: '😰', motivated: '💪'
        }
        markdown += `**Mood:** ${moodEmojis[entry.mood] || ''} ${entry.mood}  \n`
      }
      
      if (exportOptions.includeTags && entry.tags?.length > 0) {
        markdown += `**Tags:** ${entry.tags.map(tag => `\`${tag}\``).join(', ')}  \n`
      }
      
      if (exportOptions.includeStats) {
        markdown += `**Stats:** ${entry.word_count} words, ${entry.reading_time} min read  \n`
      }
      
      markdown += `\n${entry.content}\n\n`
      markdown += `---\n\n`
    })

    return markdown
  }

  const generateCSV = (data) => {
    const headers = ['ID', 'Title', 'Content', 'Created At', 'Updated At']
    
    if (exportOptions.includeTags) headers.push('Tags')
    if (exportOptions.includeMood) headers.push('Mood')
    if (exportOptions.includeStats) {
      headers.push('Word Count', 'Reading Time', 'Is Favorite')
    }

    let csv = headers.join(',') + '\n'

    data.forEach(entry => {
      const row = [
        `"${entry.id}"`,
        `"${entry.title.replace(/"/g, '""')}"`,
        `"${entry.content.replace(/"/g, '""')}"`,
        `"${entry.created_at}"`,
        `"${entry.updated_at}"`
      ]
      
      if (exportOptions.includeTags) {
        row.push(`"${entry.tags?.join('; ') || ''}"`)
      }
      if (exportOptions.includeMood) {
        row.push(`"${entry.mood || ''}"`)
      }
      if (exportOptions.includeStats) {
        row.push(entry.word_count || 0, entry.reading_time || 0, entry.is_favorite || false)
      }

      csv += row.join(',') + '\n'
    })

    return csv
  }

  const generatePDF = async (data) => {

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>My Journal Export</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .entry { margin-bottom: 30px; page-break-inside: avoid; }
          .entry-title { font-size: 1.5em; color: #333; margin-bottom: 10px; }
          .entry-meta { color: #666; font-size: 0.9em; margin-bottom: 15px; }
          .entry-content { margin-bottom: 20px; }
          .tags { font-style: italic; color: #007acc; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>My Journal Export</h1>
          <p>Export Date: ${new Date().toLocaleString()}</p>
          <p>Total Entries: ${data.length}</p>
        </div>
    `

    data.forEach(entry => {
      html += `
        <div class="entry">
          <h2 class="entry-title">${entry.title}</h2>
          <div class="entry-meta">
            <strong>Date:</strong> ${new Date(entry.created_at).toLocaleString()}
            ${exportOptions.includeMood && entry.mood ? `<br><strong>Mood:</strong> ${entry.mood}` : ''}
            ${exportOptions.includeStats ? `<br><strong>Stats:</strong> ${entry.word_count} words, ${entry.reading_time} min read` : ''}
          </div>
          <div class="entry-content">${entry.content.replace(/\n/g, '<br>')}</div>
          ${exportOptions.includeTags && entry.tags?.length > 0 ? `<div class="tags"><strong>Tags:</strong> ${entry.tags.join(', ')}</div>` : ''}
        </div>
      `
    })

    html += `
      </body>
      </html>
    `

    return html
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      
      const data = await fetchJournalData()
      if (data.length === 0) {
        alert('No entries found for the selected criteria.')
        return
      }

      let content = ''
      let filename = `journal_export_${new Date().toISOString().split('T')[0]}`
      let mimeType = 'text/plain'

      switch (exportOptions.format) {
        case 'json':
          content = generateJSON(data)
          filename += '.json'
          mimeType = 'application/json'
          break
        case 'txt':
          content = generateText(data)
          filename += '.txt'
          mimeType = 'text/plain'
          break
        case 'markdown':
          content = generateMarkdown(data)
          filename += '.md'
          mimeType = 'text/markdown'
          break
        case 'csv':
          content = generateCSV(data)
          filename += '.csv'
          mimeType = 'text/csv'
          break
        case 'pdf':
          content = await generatePDF(data)
          filename += '.html'
          mimeType = 'text/html'
          break
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setIsOpen(false)
      
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
  <button
    onClick={handleOpen}
    className="btn-secondary hover-lift"
  >
    <FiDownload className="mr-2" />
    Export
  </button>

  {isOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg border border-white/30">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gradient-primary">
            Export Journal
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 gap-2">
              {formatOptions.map(format => (
                <label
                  key={format.value}
                  className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={exportOptions.format === format.value}
                    onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value })}
                    className="mr-3 accent-blue-600"
                  />
                  <format.icon className="mr-2 text-gray-500" size={16} />
                  <div>
                    <div className="font-medium">{format.label}</div>
                    <div className="text-sm text-gray-500">{format.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FiCalendar className="inline mr-1" />
              Date Range
            </label>
            <select
              value={exportOptions.dateRange}
              onChange={(e) => setExportOptions({ ...exportOptions, dateRange: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {exportOptions.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={exportOptions.startDate}
                    onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={exportOptions.endDate}
                    onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FiFilter className="inline mr-1" />
              Content Filters
            </label>

            {moodOptions.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Mood Filter</label>
                <select
                  value={exportOptions.moodFilter}
                  onChange={(e) => setExportOptions({ ...exportOptions, moodFilter: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                >
                  <option value="">All Moods</option>
                  {moodOptions.map(mood => (
                    <option key={mood} value={mood}>
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {availableTags.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Tag Filter</label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-white/70 backdrop-blur-sm">
                  {availableTags.map(tag => (
                    <label key={tag.id} className="flex items-center py-1 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exportOptions.selectedTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportOptions({
                              ...exportOptions,
                              selectedTags: [...exportOptions.selectedTags, tag]
                            })
                          } else {
                            setExportOptions({
                              ...exportOptions,
                              selectedTags: exportOptions.selectedTags.filter(t => t !== tag)
                            })
                          }
                        }}
                        className="mr-2 accent-blue-600 cursor-pointer"
                      />
                      #{tag.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include in Export
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTags}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeTags: e.target.checked })}
                  className="mr-2 accent-blue-600"
                />
                <span className="text-sm">Tags</span>
              </label>
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMood}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeMood: e.target.checked })}
                  className="mr-2 accent-blue-600"
                />
                <span className="text-sm">Mood data</span>
              </label>
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={exportOptions.includeStats}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeStats: e.target.checked })}
                  className="mr-2 accent-blue-600"
                />
                <span className="text-sm">Statistics (word count, reading time)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <FiDownload className="mr-2" />
              )}
              {loading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
</>)}
