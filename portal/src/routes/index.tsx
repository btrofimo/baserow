import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/projects' })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-6 px-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dc4b1a]">
          <span className="text-2xl font-bold text-white">T</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">TCR Client Portal</h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          Submit and track your project requests in one place
        </p>
        <Link
          to="/auth/login"
          className="inline-block px-8 py-3 bg-[#dc4b1a] text-white rounded-lg text-lg font-medium hover:bg-[#c54318] transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}
