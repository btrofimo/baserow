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
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dc4b1a]">
              <span className="text-sm font-bold text-white">T</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">TCR Client Portal</h1>
          </div>
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

        {isLoading && <ProjectsTableSkeleton />}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-700 text-sm">
              Failed to load projects. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}
        {data && data.records.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">You have no projects yet.</p>
            <Link
              to="/projects/submit"
              className="inline-block px-6 py-2 bg-[#dc4b1a] text-white rounded-lg text-sm font-medium hover:bg-[#c54318] transition-colors"
            >
              Submit Your First Project
            </Link>
          </div>
        )}
        {data && data.records.length > 0 && (
          <ProjectsTable data={data.records} />
        )}
      </main>
    </div>
  )
}

function ProjectsTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-10 bg-gray-100" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-6 py-4 border-t border-gray-100">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-4 w-12 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
