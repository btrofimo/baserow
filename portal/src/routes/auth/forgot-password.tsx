import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  requestPasswordReset,
  confirmPasswordReset,
} from '../../api/auth.functions'

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [destination, setDestination] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await requestPasswordReset({ data: { email } })

      if (result.type === 'error') {
        setError(result.message)
        return
      }

      setDestination(result.destination)
      setStep('code')
    } catch {
      setError('Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmReset(e: React.FormEvent) {
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
      const result = await confirmPasswordReset({
        data: { email, code, newPassword },
      })

      if (result.type === 'error') {
        setError(result.message)
        return
      }

      setStep('done')
    } catch {
      setError('Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">
            {step === 'email' && "We'll send a verification code to your email"}
            {step === 'code' &&
              `Enter the code sent to ${destination}`}
            {step === 'done' && 'Your password has been reset'}
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-[#dc4b1a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c54318] disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleConfirmReset} className="space-y-5">
              <div>
                <label
                  htmlFor="code"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#dc4b1a] focus:ring-2 focus:ring-[#dc4b1a]/20 focus:outline-none"
                  placeholder="Enter 6-digit code"
                />
              </div>

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
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setError('')
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Resend code
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Your password has been reset successfully.
              </p>
              <Link
                to="/auth/login"
                className="inline-block rounded-lg bg-[#dc4b1a] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c54318]"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          {step !== 'done' && (
            <div className="mt-4 text-center">
              <Link
                to="/auth/login"
                className="text-sm text-[#dc4b1a] hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
