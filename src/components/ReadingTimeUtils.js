// ReadingTimeUtils.js
import React from 'react'
import { FiClock } from 'react-icons/fi'

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

export default ReadingTimeUtils
