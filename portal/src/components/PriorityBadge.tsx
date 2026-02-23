const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-orange-100 text-orange-800',
  Low: 'bg-slate-100 text-slate-800',
}

interface PriorityBadgeProps {
  priority: string
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style = PRIORITY_STYLES[priority] ?? 'bg-slate-100 text-slate-600'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
    >
      {priority}
    </span>
  )
}
