import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { KeyRound, Mail, Lock, CheckCircle2 } from 'lucide-react'
import {
  requestPasswordReset,
  confirmPasswordReset,
} from '../../api/auth.functions'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'sent' | 'reset' | 'done'>(
    'email'
  )
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
      setStep('sent')
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

  const steps = ['email', 'sent', 'reset', 'done'] as const
  const currentIndex = steps.indexOf(step)

  return (
    <AuthLayout>
      <div>
        {/* Step indicator dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-colors ${
                i <= currentIndex ? 'bg-accent-orange' : 'bg-bg-elevated'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Enter email */}
        {step === 'email' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
              <KeyRound size={24} className="text-accent-orange" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-text-primary">
              Forgot password?
            </h1>
            <p className="mb-6 text-sm text-text-secondary">
              No worries, we&apos;ll send you reset instructions.
            </p>
            <form onSubmit={handleRequestCode} className="space-y-5 text-left">
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
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Sending...' : 'Reset password'}
              </Button>
            </form>
            <Link
              to="/auth/login"
              className="mt-4 inline-block text-sm text-text-muted hover:text-text-secondary"
            >
              Back to log in
            </Link>
          </div>
        )}

        {/* Step 2: Check email */}
        {step === 'sent' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
              <Mail size={24} className="text-accent-orange" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-text-primary">
              Check your email
            </h1>
            <p className="mb-6 text-sm text-text-secondary">
              We sent a verification code to {destination}
            </p>
            <Button
              className="w-full"
              onClick={() => setStep('reset')}
            >
              Enter code
            </Button>
            <p className="mt-4 text-sm text-text-muted">
              Didn&apos;t receive the email?{' '}
              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setError('')
                }}
                className="text-accent-orange hover:text-accent-orange-hover"
              >
                Click to resend
              </button>
            </p>
            <Link
              to="/auth/login"
              className="mt-2 inline-block text-sm text-text-muted hover:text-text-secondary"
            >
              Back to log in
            </Link>
          </div>
        )}

        {/* Step 3: Set new password */}
        {step === 'reset' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
              <Lock size={24} className="text-accent-orange" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-text-primary">
              Set new password
            </h1>
            <p className="mb-6 text-sm text-text-secondary">
              Enter the code and your new password.
            </p>
            <form
              onSubmit={handleConfirmReset}
              className="space-y-5 text-left"
            >
              <Input
                id="code"
                label="Verification Code"
                type="text"
                required
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
              />
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

              <div className="space-y-1.5 text-left text-xs text-text-muted">
                <p
                  className={
                    newPassword.length >= 8 ? 'text-green-400' : ''
                  }
                >
                  {newPassword.length >= 8 ? '\u2713' : '\u2022'} Must be at
                  least 8 characters
                </p>
                <p
                  className={
                    newPassword && newPassword === confirmPassword
                      ? 'text-green-400'
                      : ''
                  }
                >
                  {newPassword && newPassword === confirmPassword
                    ? '\u2713'
                    : '\u2022'}{' '}
                  Passwords must match
                </p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Resetting...' : 'Reset password'}
              </Button>
            </form>
            <Link
              to="/auth/login"
              className="mt-4 inline-block text-sm text-text-muted hover:text-text-secondary"
            >
              Back to log in
            </Link>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'done' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 size={24} className="text-green-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-text-primary">
              Password reset
            </h1>
            <p className="mb-6 text-sm text-text-secondary">
              Your password has been successfully reset.
            </p>
            <Link to="/auth/login" className="block">
              <Button className="w-full">Continue</Button>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
