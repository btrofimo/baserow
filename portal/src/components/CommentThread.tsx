import { useForm } from '@tanstack/react-form'
import { Send, Paperclip } from 'lucide-react'

interface Comment {
  id: string
  fields: {
    Author?: string
    Body?: string
    'Created At'?: string
  }
}

interface CommentThreadProps {
  comments: Comment[]
  onSubmit: (body: string) => Promise<void>
  isSubmitting: boolean
}

export function CommentThread({
  comments,
  onSubmit,
  isSubmitting,
}: CommentThreadProps) {
  const form = useForm({
    defaultValues: { body: '' },
    onSubmit: async ({ value }) => {
      await onSubmit(value.body)
      form.reset()
    },
  })

  return (
    <div className="space-y-4">
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-text-muted">No messages yet.</p>
        )}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg bg-bg-tertiary p-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-accent-orange">
                {comment.fields.Author ?? 'Unknown'}
              </span>
              <span className="text-xs text-text-muted">
                {comment.fields['Created At']
                  ? new Date(comment.fields['Created At']).toLocaleString()
                  : ''}
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              {comment.fields.Body}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          disabled
          className="rounded-md p-2 text-text-muted opacity-50"
        >
          <Paperclip size={16} />
        </button>
        <form.Field name="body">
          {(field) => (
            <input
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="flex-1 rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-2 focus:ring-accent-orange/20 focus:outline-none"
              placeholder="Type a message..."
            />
          )}
        </form.Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-orange text-white transition-colors hover:bg-accent-orange-hover disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
