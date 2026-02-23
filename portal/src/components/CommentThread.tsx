import { useForm } from '@tanstack/react-form'

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
      <h3 className="text-lg font-semibold text-gray-900">Messages</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-gray-500">No messages yet.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {comment.fields.Author ?? 'Unknown'}
              </span>
              <span className="text-xs text-gray-400">
                {comment.fields['Created At']
                  ? new Date(comment.fields['Created At']).toLocaleString()
                  : ''}
              </span>
            </div>
            <p className="text-sm text-gray-600">{comment.fields.Body}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="flex gap-2"
      >
        <form.Field name="body">
          {(field) => (
            <input
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Type a message..."
            />
          )}
        </form.Field>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-[#dc4b1a] text-white rounded-lg text-sm font-medium hover:bg-[#c54318] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
