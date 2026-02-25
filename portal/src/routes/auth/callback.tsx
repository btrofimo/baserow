import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { handleAuthCallback } from '../../api/auth.functions'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      navigate({ to: '/' })
      return
    }

    handleAuthCallback({ data: { code } })
      .then((result) => {
        sessionStorage.setItem('idToken', result.idToken)
        sessionStorage.setItem('user', JSON.stringify(result.user))
        navigate({ to: '/projects' })
      })
      .catch(() => {
        navigate({ to: '/auth/login' })
      })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-border-default border-t-accent-orange" />
        <p className="text-lg text-text-secondary">Signing you in...</p>
      </div>
    </div>
  )
}
