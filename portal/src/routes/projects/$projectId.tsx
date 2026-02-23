import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getProject } from '../../api/projects.functions'
import { listComments, addComment } from '../../api/comments.functions'
import { StatusTimeline } from '../../components/StatusTimeline'
import { StatusBadge } from '../../components/StatusBadge'
import { PriorityBadge } from '../../components/PriorityBadge'
import { CommentThread } from '../../components/CommentThread'

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const { isAuthenticated, idToken } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/' })
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            to="/projects"
            className="text-sm text-[#dc4b1a] hover:underline"
          >
            &larr; Back to Projects
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {projectQuery.isLoading && <p>Loading project...</p>}
        {projectQuery.error && (
          <p className="text-red-600">Failed to load project.</p>
        )}

        {project && (
          <>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {(fields['Street'] as string) ?? 'Untitled Project'}
                  </h2>
                  <p className="text-gray-600">
                    {(fields['City'] as string) ?? ''},{' '}
                    {(fields['State'] as string) ?? ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={(fields['Status'] as string) ?? ''} />
                  <PriorityBadge
                    priority={(fields['Priority'] as string) ?? ''}
                  />
                </div>
              </div>

              <StatusTimeline
                currentStatus={(fields['Status'] as string) ?? ''}
              />

              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                  <span className="text-gray-500">File No:</span>{' '}
                  <span className="font-medium">
                    {(fields['File No'] as string) ?? 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Request Type:</span>{' '}
                  <span className="font-medium">
                    {Array.isArray(fields['Request Type'])
                      ? (fields['Request Type'] as string[]).join(', ')
                      : 'N/A'}
                  </span>
                </div>
                {fields['Notes'] && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Notes:</span>{' '}
                    <span>{fields['Notes'] as string}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <CommentThread
                comments={(commentsQuery.data?.records ?? []) as any}
                onSubmit={(body) => addCommentMutation.mutateAsync(body)}
                isSubmitting={addCommentMutation.isPending}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
