import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import Link from 'next/link'
import { FiHome, FiMail, FiLock, FiLogIn, FiUserPlus, FiHeart, FiStar } from 'react-icons/fi'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="main-container min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-4">
          <FiHeart className="h-6 w-6 text-white animate-bounce-gentle" />
        </div>
        <h1 className="text-gradient-primary text-4xl font-bold mb-2">
          Welcome Back! ✨
        </h1>
        <p className="text-gray-600">Sign in to continue your journaling journey</p>
      </div>

      <div className="card-glass hover-lift p-8 space-y-6 animate-slide-up">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center space-x-3">
            <svg
              className="h-5 w-5 text-red-400 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-11.707a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiMail className="inline mr-2" />
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glass w-full"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiLock className="inline mr-2" />
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-glass w-full"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary hover-glow w-full py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing you in...
                </>
              ) : (
                <>
                  <FiLogIn className="mr-2" />
                  Sign In 
                </>
              )}
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/signup"
            className="btn-secondary hover-scale inline-flex items-center px-6 py-2 text-sm font-medium"
          >
            <FiUserPlus className="mr-2 h-4 w-4" />
            Create New Account
          </Link>
        </div>

        <div className="text-center mt-6 text-xs text-gray-500">
          <Link href="/" className="text-gray-500 hover:text-gray-700 inline-flex items-center">
            <FiHome className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  </div>
)

}