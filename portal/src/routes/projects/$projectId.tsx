import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getProject } from '../../api/projects.functions'
import { listComments, addComment } from '../../api/comments.functions'
import { StatusBadge } from '../../components/StatusBadge'
import { PriorityBadge } from '../../components/PriorityBadge'
import { RequestTypeTags } from '../../components/RequestTypeTags'
import { CommentThread } from '../../components/CommentThread'
import { AppLayout } from '../../components/layout/AppLayout'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailPage,
})

function FieldRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-text-primary">{value}</dd>
    </div>
  )
}

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const { isAuthenticated, idToken } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth/login' })
    }
  }, [isAuthenticated, navigate])

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () =>
      getProject({ data: { idToken: idToken!, recordId: projectId } }),
    enabled: !!idToken,
  })

  const commentsQuery = useQuery({
    queryKey: ['comments', projectId],
    queryFn: () =>
      listComments({
        data: { idToken: idToken!, projectRecordId: projectId },
      }),
    enabled: !!idToken,
    refetchInterval: 30000,
  })

  const addCommentMutation = useMutation({
    mutationFn: (body: string) =>
      addComment({
        data: { idToken: idToken!, projectRecordId: projectId, body },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] })
    },
  })

  if (!isAuthenticated) return null

  const project = projectQuery.data
  const fields = project?.fields ?? {}

  const tabs = [
    { id: 'details', label: 'Project Details' },
    { id: 'documents', label: 'Documents' },
    { id: 'photos', label: 'Photos' },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <AppLayout>
      {/* Back link */}
      <Link
        to="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-orange hover:text-accent-orange-hover"
      >
        <ArrowLeft size={14} />
        BACK TO PROJECTS
      </Link>

      {projectQuery.isLoading && <ProjectDetailSkeleton />}

      {projectQuery.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">Failed to load project.</p>
          <button
            onClick={() => projectQuery.refetch()}
            className="mt-2 text-sm text-red-400 underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {project && (
        <>
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-orange/10">
                <FileText size={20} className="text-accent-orange" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  {(fields['File No'] as string) ||
                    (fields['Street'] as string) ||
                    'Untitled Project'}
                </h1>
                <p className="text-sm text-text-secondary">
                  {[
                    fields['Street'] as string,
                    fields['City'] as string,
                    fields['State'] as string,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={(fields['Status'] as string) ?? ''} />
              <PriorityBadge
                priority={(fields['Priority'] as string) ?? ''}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="mt-4">
            {/* Project Details tab */}
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <FieldRow
                      label="Status"
                      value={
                        <StatusBadge
                          status={(fields['Status'] as string) ?? ''}
                        />
                      }
                    />
                    <FieldRow
                      label="File No"
                      value={fields['File No'] as string}
                    />
                    <FieldRow
                      label="DOL"
                      value={fields['DOL'] as string}
                    />
                    <FieldRow
                      label="Hail Size"
                      value={fields['Hail Size'] as string}
                    />
                    <FieldRow
                      label="County"
                      value={fields['County'] as string}
                    />
                    <FieldRow
                      label="Coordinates"
                      value={
                        fields['Latitude'] && fields['Longitude']
                          ? `${fields['Latitude']}, ${fields['Longitude']}`
                          : undefined
                      }
                    />
                    <FieldRow
                      label="Owner Company"
                      value={fields['Owner Company'] as string}
                    />
                    <FieldRow
                      label="Owner POC"
                      value={fields['Owner'] as string}
                    />
                    <FieldRow
                      label="Company"
                      value={fields['Company'] as string}
                    />
                    <FieldRow
                      label="POC"
                      value={fields['POC'] as string}
                    />
                    <FieldRow
                      label="Roof Area"
                      value={fields['Roof Area'] as string}
                    />
                    <FieldRow
                      label="Roofing System"
                      value={fields['Roofing System'] as string}
                    />
                    <FieldRow
                      label="Insulation"
                      value={fields['Insulation'] as string}
                    />
                    <FieldRow
                      label="No. RTUs"
                      value={
                        fields['No. RTUs'] != null
                          ? String(fields['No. RTUs'])
                          : undefined
                      }
                    />
                    <div className="col-span-full">
                      <FieldRow
                        label="Request Type"
                        value={
                          Array.isArray(fields['Request Type']) ? (
                            <RequestTypeTags
                              types={fields['Request Type'] as string[]}
                            />
                          ) : undefined
                        }
                      />
                    </div>
                  </dl>

                  {fields['Notes'] && (
                    <div className="mt-6 border-t border-border-default pt-4">
                      <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">
                        Inspection Notes
                      </dt>
                      <dd className="mt-2 text-sm text-text-secondary whitespace-pre-wrap">
                        {fields['Notes'] as string}
                      </dd>
                    </div>
                  )}
                </Card>

                {/* Right side — placeholder for project photo */}
                <Card className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-bg-tertiary">
                      <FileText size={24} className="text-text-muted" />
                    </div>
                    <p className="text-sm text-text-muted">
                      No project photos
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Documents tab */}
            {activeTab === 'documents' && (
              <Card>
                <div className="py-12 text-center">
                  <p className="text-text-muted">Coming Soon</p>
                </div>
              </Card>
            )}

            {/* Photos tab */}
            {activeTab === 'photos' && (
              <Card>
                <div className="py-12 text-center">
                  <p className="text-text-muted">Coming Soon</p>
                </div>
              </Card>
            )}

            {/* Activity tab */}
            {activeTab === 'activity' && (
              <Card>
                <h3 className="mb-4 text-lg font-semibold text-text-primary">
                  Messages
                </h3>
                <CommentThread
                  comments={
                    (commentsQuery.data?.records ?? []) as Array<{
                      id: string
                      fields: {
                        Author?: string
                        Body?: string
                        'Created At'?: string
                      }
                    }>
                  }
                  onSubmit={async (body) => {
                    await addCommentMutation.mutateAsync(body)
                  }}
                  isSubmitting={addCommentMutation.isPending}
                />
              </Card>
            )}
          </div>
        </>
      )}
    </AppLayout>
  )
}

function ProjectDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-bg-elevated" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-bg-elevated" />
            <div className="h-4 w-32 rounded bg-bg-elevated" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-bg-elevated" />
          <div className="h-6 w-16 rounded-full bg-bg-elevated" />
        </div>
      </div>
      <div className="h-10 w-full rounded bg-bg-elevated" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border-default p-6">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded bg-bg-elevated" />
                <div className="h-4 w-24 rounded bg-bg-elevated" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border-default p-6">
          <div className="h-32 rounded bg-bg-elevated" />
        </div>
      </div>
    </div>
  )
}
