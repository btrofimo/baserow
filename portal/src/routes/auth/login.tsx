import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  login,
  completeNewPassword,
} from '../../api/auth.functions'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

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
    <AuthLayout>
      <div>
        <h1 className="mb-2 text-3xl font-bold text-text-primary">
          {step === 'login' ? 'Log in' : 'Set new password'}
        </h1>
        <p className="mb-8 text-sm text-text-secondary">
          {step === 'login'
            ? 'Welcome back! Please enter your details.'
            : 'Your temporary password has expired. Please choose a new password.'}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              id="email"
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-text-secondary"
                >
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-accent-orange hover:text-accent-orange-hover"
                >
                  Forgot password
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-border-default bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-border-focus focus:ring-2 focus:ring-accent-orange/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-border-default bg-bg-tertiary accent-accent-orange"
              />
              <label
                htmlFor="remember"
                className="text-sm text-text-secondary"
              >
                Remember for 30 days
              </label>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        )}

        {step === 'change-password' && (
          <form onSubmit={handleChangePassword} className="space-y-5">
            <Input
              id="newPassword"
              label="New Password"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Setting password...' : 'Set New Password'}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
