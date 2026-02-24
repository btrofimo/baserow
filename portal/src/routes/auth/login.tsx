import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  login,
  completeNewPassword,
} from '../../api/auth.functions'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [step, setStep] = useState<'login' | 'change-password'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [session, setSession] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/projects' })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login({ data: { email, password } })

      if (result.type === 'error') {
        setError(result.message)
        return
      }

      if (result.type === 'challenge') {
        setSession(result.session)
        setStep('change-password')
        return
      }

      sessionStorage.setItem('idToken', result.idToken)
      sessionStorage.setItem('user', JSON.stringify(result.user))
      window.location.href = '/projects'
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)

    try {
      const result = await completeNewPassword({
        data: { email, newPassword, session },
      })

      if (result.type === 'error') {
        setError(result.message)
        return
      }

      sessionStorage.setItem('idToken', result.idToken)
      sessionStorage.setItem('user', JSON.stringify(result.user))
      window.location.href = '/projects'
    } catch {
      setError('Failed to change password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">TCR Client Portal</h1>
          <p className="mt-2 text-gray-600">
            {step === 'login'
              ? 'Sign in to manage your projects'
              : 'Please set a new password'}
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#dc4b1a] focus:ring-2 focus:ring-[#dc4b1a]/20 focus:outline-none"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#dc4b1a] focus:ring-2 focus:ring-[#dc4b1a]/20 focus:outline-none"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#dc4b1a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c54318] disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-[#dc4b1a] hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          )}

          {step === 'change-password' && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <p className="text-sm text-gray-600">
                Your temporary password has expired. Please choose a new
                password.
              </p>

              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#dc4b1a] focus:ring-2 focus:ring-[#dc4b1a]/20 focus:outline-none"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#dc4b1a] focus:ring-2 focus:ring-[#dc4b1a]/20 focus:outline-none"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#dc4b1a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c54318] disabled:opacity-50"
              >
                {isLoading ? 'Setting password...' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} TCR. All rights reserved.
        </p>
      </div>
    </div>
  )
}
