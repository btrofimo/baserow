import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { listProjects } from '../../api/projects.functions'
import { ProjectsTable } from '../../components/ProjectsTable'
import { AppLayout } from '../../components/layout/AppLayout'
import { Tabs } from '../../components/ui/Tabs'
import { Button } from '../../components/ui/Button'

export const Route = createFileRoute('/projects/')({
  component: ProjectsListPage,
})

const ACTIVE_STATUSES = [
  'New Project',
  'New Request',
  'Submitted',
  'In-Progress',
  'In Review',
  'RFI',
  'Pending Inspection',
  'Inspected',
  'Report Generation',
  'Estimate Generation',
  'Document Generation',
  'In Revision',
]

const COMPLETED_STATUSES = ['Completed', 'Accepted']
const ARCHIVE_STATUSES = ['Archived', 'Withdrawn']

function ProjectsListPage() {
  const { isAuthenticated, idToken } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth/login' })
    }
  }, [isAuthenticated, navigate])

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', idToken],
    queryFn: () => listProjects({ data: { idToken: idToken! } }),
    enabled: !!idToken,
  })

  const allRecords = data?.records ?? []

  const { activeProjects, completedProjects, archivedProjects } =
    useMemo(() => {
      const active = allRecords.filter((r) => {
        const status = r.fields['Status'] as string | undefined
        return !status || ACTIVE_STATUSES.includes(status)
      })
      const completed = allRecords.filter((r) =>
        COMPLETED_STATUSES.includes(r.fields['Status'] as string)
      )
      const archived = allRecords.filter((r) =>
        ARCHIVE_STATUSES.includes(r.fields['Status'] as string)
      )
      return {
        activeProjects: active,
        completedProjects: completed,
        archivedProjects: archived,
      }
    }, [allRecords])

  const filteredProjects =
    activeTab === 'completed'
      ? completedProjects
      : activeTab === 'archive'
        ? archivedProjects
        : activeProjects

  const tabs = [
    { id: 'active', label: 'Active', count: activeProjects.length },
    { id: 'completed', label: 'Completed', count: completedProjects.length },
    { id: 'archive', label: 'Archive', count: archivedProjects.length },
  ]

  if (!isAuthenticated) return null

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <Link to="/projects/submit">
          <Button className="flex items-center gap-1.5">
            <Plus size={16} />
            New Project
          </Button>
        </Link>
      </div>

      {isLoading && <ProjectsTableSkeleton />}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            Failed to load projects. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-400 underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {data && allRecords.length === 0 && (
        <div className="py-16 text-center">
          <p className="mb-4 text-text-muted">You have no projects yet.</p>
          <Link to="/projects/submit">
            <Button>Submit Your First Project</Button>
          </Link>
        </div>
      )}

      {data && allRecords.length > 0 && (
        <>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="mt-4">
            <ProjectsTable data={filteredProjects} />
          </div>
        </>
      )}
    </AppLayout>
  )
}

function ProjectsTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="overflow-hidden rounded-lg border border-border-default">
        <div className="h-10 bg-bg-tertiary" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-t border-border-default px-6 py-4"
          >
            <div className="h-4 w-20 rounded bg-bg-elevated" />
            <div className="h-4 w-32 rounded bg-bg-elevated" />
            <div className="h-4 w-24 rounded bg-bg-elevated" />
            <div className="h-4 w-12 rounded bg-bg-elevated" />
            <div className="h-4 w-16 rounded bg-bg-elevated" />
            <div className="h-4 w-16 rounded bg-bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  )
}
