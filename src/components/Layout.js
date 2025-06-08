import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { FiHome, FiPlus, FiTag, FiLogOut, FiCheckCircle } from 'react-icons/fi'
import Image from 'next/image'


const emojis = ['🎉', '🚀', '✨', '🌈', '🔥', '💫', '🌟', '🍀', '🎈']

function FloatingEmoji({ emoji, style }) {
  return (
    <span
      className="absolute animate-bounce-gentle select-none"
      style={{ fontSize: '1.5rem', userSelect: 'none', ...style }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  )
}

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const isActive = (pathname) => router.pathname === pathname

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      <FloatingEmoji emoji={emojis[0]} style={{ top: '10%', left: '5%', opacity: 0.3 }} />
      <FloatingEmoji emoji={emojis[1]} style={{ top: '30%', left: '90%', opacity: 0.25, fontSize: '2rem' }} />
      <FloatingEmoji emoji={emojis[2]} style={{ top: '70%', left: '15%', opacity: 0.2, fontSize: '1.8rem' }} />
      <FloatingEmoji emoji={emojis[3]} style={{ top: '50%', left: '50%', opacity: 0.15, fontSize: '2.5rem' }} />
      <FloatingEmoji emoji={emojis[4]} style={{ top: '85%', left: '80%', opacity: 0.3 }} />

      <nav className="nav-glass shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="MyJournal Logo" width={40} height={40} className="rounded-full" />
              <span className="text-xl font-bold text-indigo-600 select-none cursor-default">MyJournal</span>
            </div>
            {user && (
              <div className="hidden sm:flex sm:space-x-8">
                <Link href="/" passHref
                    className={`nav-link inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/') 
                        ? 'border-indigo-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <FiHome className="mr-1" /> Home
                </Link>
                <Link href="/tags" passHref
                    className={`nav-link inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/tags') 
                        ? 'border-indigo-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <FiTag className="mr-1" /> Journal
                </Link>
                <Link href="/todos" passHref
                    className={`nav-link inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/todos') 
                        ? 'border-indigo-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <FiCheckCircle className="mr-1" /> To-Do List
                </Link>
              </div>
            )}
            <div className="hidden sm:flex items-center space-x-4">
              {user ? (
                <button
                  onClick={signOut}
                  href="/_app" passHref
                  className="btn-primary flex items-center"
                >
                  <FiLogOut className="mr-1" /> Sign Out
                </button>
              ) : (
                <>
                  <Link href="/login" passHref className="btn-secondary flex items-center">
                      <FiCheckCircle className="mr-1" /> Sign In

                  </Link>
                  <Link href="/signup" passHref className="btn-primary flex items-center">
                      <FiCheckCircle className="mr-1" /> Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow relative">
        <FloatingEmoji emoji={emojis[5]} style={{ top: '5%', right: '15%', fontSize: '2rem', opacity: 0.2 }} />
        <FloatingEmoji emoji={emojis[6]} style={{ bottom: '15%', left: '10%', fontSize: '1.5rem', opacity: 0.15 }} />
        <FloatingEmoji emoji={emojis[7]} style={{ bottom: '10%', right: '40%', fontSize: '2rem', opacity: 0.25 }} />
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>

      <footer className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-6 text-center select-none relative">
        <p className="text-lg font-semibold max-w-3xl mx-auto px-4">
          "Write your story with courage and grace, Each word a step toward your brighter place.✨🌟🚀"
        </p>
        <span className="absolute top-2 left-4 text-2xl animate-bounce-gentle select-none">🌈</span>
        <span className="absolute top-3 right-6 text-xl animate-bounce-gentle select-none">🔥</span>
        <span className="absolute bottom-3 right-10 text-3xl animate-bounce-gentle select-none">💫</span>
      </footer>
    </div>
  )
}
