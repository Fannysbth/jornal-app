import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import { FiHome,FiEdit, FiTrash2, FiPlus } from 'react-icons/fi'
import JournalModal from '../components/JournalModal'

export default function Home() {
  const { user } = useAuth()
  const [journals, setJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentJournal, setCurrentJournal] = useState(null)

  useEffect(() => {
    if (user) {
      fetchJournals()
    }
  }, [user])

  const fetchJournals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('journal_entries_with_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJournals(data)
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', id)

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

  const handleModalClose = () => {
    setIsModalOpen(false)
    setCurrentJournal(null)
    fetchJournals()
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to MyJournal</h1>
        <p className="text-lg text-gray-600 mb-8">Please sign in to view or create journal entries.</p>
        <div className="flex justify-center space-x-4">
          <Link href="/login"className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <FiHome className="mr-1" /> Sign In
          </Link>
          <Link href="/signup" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <FiHome className="mr-1" /> Sign Up
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Journal Entries</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="mr-1" /> New Entry
        </button>
        <ExportButton />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p>Loading...</p>
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No journal entries yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {journals.map((journal) => (
            <div key={journal.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{journal.title}</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(journal.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(journal)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(journal.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-line">{journal.content}</p>
              {journal.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {journal.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <JournalModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userId={user?.id}
        journal={currentJournal}
      />
    </div>
  )
}