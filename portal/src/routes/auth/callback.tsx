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
        navigate({ to: '/' })
      })
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Signing you in...</p>
    </div>
  )
}
