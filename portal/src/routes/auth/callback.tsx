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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#dc4b1a]" />
        <p className="text-lg text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}
