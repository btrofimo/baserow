import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FolderOpen,
  FilePlus,
  FileText,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { listProjects } from '../api/projects.functions'
import { AppLayout } from '../components/layout/AppLayout'
import { Card } from '../components/ui/Card'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { isAuthenticated, idToken, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth/login' })
    }
  }, [isAuthenticated, navigate])

  const { data } = useQuery({
    queryKey: ['projects', idToken],
    queryFn: () => listProjects({ data: { idToken: idToken! } }),
    enabled: !!idToken,
  })

  if (!isAuthenticated) return null

  const projectCount = data?.records.length ?? 0

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Hey, Welcome {user?.email?.split('@')[0]}.
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Here&apos;s an overview of your projects.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Projects */}
        <Link to="/projects">
          <Card className="group cursor-pointer transition-colors hover:border-accent-orange/40">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-orange/10">
                <FolderOpen size={20} className="text-accent-orange" />
              </div>
              <ArrowRight
                size={16}
                className="text-text-muted transition-transform group-hover:translate-x-0.5"
              />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-text-primary">
                {projectCount}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Active Projects
              </p>
            </div>
          </Card>
        </Link>

        {/* Submit New */}
        <Link to="/projects/submit">
          <Card className="group cursor-pointer transition-colors hover:border-accent-orange/40">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <FilePlus size={20} className="text-green-400" />
              </div>
              <ArrowRight
                size={16}
                className="text-text-muted transition-transform group-hover:translate-x-0.5"
              />
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-text-primary">
                Submit New Project
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Create a new request
              </p>
            </div>
          </Card>
        </Link>

        {/* Documents */}
        <Card className="opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-text-primary">Documents</p>
            <p className="mt-1 text-sm text-text-muted">Coming Soon</p>
          </div>
        </Card>

        {/* Resources */}
        <Card className="opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <BookOpen size={20} className="text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-text-primary">Resources</p>
            <p className="mt-1 text-sm text-text-muted">Coming Soon</p>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
