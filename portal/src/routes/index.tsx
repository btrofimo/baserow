import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/projects' })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">TCR Client Portal</h1>
        <p className="text-lg text-gray-600">
          Submit and track your project requests
        </p>
        <button
          onClick={login}
          className="px-8 py-3 bg-[#dc4b1a] text-white rounded-lg text-lg font-medium hover:bg-[#c54318] transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
