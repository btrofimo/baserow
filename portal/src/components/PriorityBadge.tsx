import { Circle, AlertCircle, AlertTriangle } from 'lucide-react'

const PRIORITY_CONFIG: Record<
  string,
  { icon: typeof Circle; style: string; iconColor: string }
> = {
  Normal: {
    icon: Circle,
    style: 'border border-border-default text-text-secondary',
    iconColor: 'text-text-muted',
  },
  Low: {
    icon: Circle,
    style: 'border border-border-default text-text-secondary',
    iconColor: 'text-text-muted',
  },
  Medium: {
    icon: AlertCircle,
    style: 'border border-orange-400 text-orange-400',
    iconColor: 'text-orange-400',
  },
  High: {
    icon: AlertTriangle,
    style: 'bg-red-500/10 border border-red-500 text-red-400',
    iconColor: 'text-red-400',
  },
}

interface PriorityBadgeProps {
  priority: string
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG['Normal']
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.style}`}
    >
      <Icon size={12} className={config.iconColor} />
      {priority}
    </span>
  )
}
