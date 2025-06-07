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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header dengan animasi */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-6">
            <FiHeart className="mx-auto text-6xl text-gradient-primary animate-bounce-gentle" />
          </div>
          <h1 className="text-4xl font-bold text-gradient-rainbow mb-2">
            Welcome Back! ✨
          </h1>
          <p className="text-lg text-gray-600">
            Sign in to continue your journaling journey
          </p>
        </div>

        {/* Form Card */}
        <div className="card-glass animate-slide-up">
          {/* Error Alert dengan styling yang lebih baik */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center animate-fade-in">
              <div className="flex-shrink-0 mr-3">
                ⚠️
              </div>
              <div>
                <strong>Oops!</strong> {error}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
                <FiMail className="mr-2 text-blue-500" />
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass pl-10"
                  placeholder="Enter your email address"
                />
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center">
                <FiLock className="mr-2 text-purple-500" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-glass pl-10"
                  placeholder="Enter your password"
                />
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-primary hover-lift ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner-colorful mr-3" style={{ width: '20px', height: '20px' }}></div>
                    Signing you in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FiLogIn className="mr-2" />
                    Sign In to Your Account
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              New to our journaling community? 🌟
            </p>
            <Link href="/signup" className="btn-secondary hover-lift inline-flex items-center">
              <FiUserPlus className="mr-2" />
              Create New Account
            </Link>
          </div>

          {/* Additional Links */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-3">
            <Link href="/" className="nav-link inline-flex items-center text-gray-500 hover:text-gray-700">
              <FiHome className="mr-2" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Footer inspirational text */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-gray-500 leading-relaxed">
            "Every login is a new chapter waiting to be written. 
            Welcome back to your personal sanctuary of thoughts and dreams." 💭
          </p>
        </div>

        {/* Floating decoration elements */}
        <div className="fixed top-10 left-10 text-2xl animate-bounce-gentle opacity-30" style={{ animationDelay: '0s' }}>
          ✨
        </div>
        <div className="fixed top-20 right-10 text-2xl animate-bounce-gentle opacity-30" style={{ animationDelay: '1s' }}>
          🌟
        </div>
        <div className="fixed bottom-10 left-20 text-2xl animate-bounce-gentle opacity-30" style={{ animationDelay: '2s' }}>
          💫
        </div>
        <div className="fixed bottom-20 right-20 text-2xl animate-bounce-gentle opacity-30" style={{ animationDelay: '0.5s' }}>
          ⭐
        </div>
      </div>
    </div>
  )
}