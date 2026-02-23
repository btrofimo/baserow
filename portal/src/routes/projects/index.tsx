import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listProjects } from '../../api/projects.functions'
import { ProjectsTable } from '../../components/ProjectsTable'

export const Route = createFileRoute('/projects/')({
  component: ProjectsListPage,
})

function ProjectsListPage() {
  const { isAuthenticated, idToken, user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', idToken],
    queryFn: () => listProjects({ data: { idToken: idToken! } }),
    enabled: !!idToken,
  })

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">TCR Client Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Your Projects</h2>
          <Link
            to="/projects/submit"
            className="px-4 py-2 bg-[#dc4b1a] text-white rounded-lg text-sm font-medium hover:bg-[#c54318] transition-colors"
          >
            Submit New Project
          </Link>
        </div>

        {isLoading && <p className="text-gray-500">Loading projects...</p>}
        {error && (
          <p className="text-red-600">
            Failed to load projects. Please try again.
          </p>
        )}
        {data && <ProjectsTable data={data.records} />}
      </main>
    </div>
  )
}
