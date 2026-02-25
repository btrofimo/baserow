const STATUS_STYLES: Record<string, string> = {
  'New Project': 'bg-status-new-bg text-status-new-text',
  'New Request': 'bg-status-new-bg text-status-new-text',
  Submitted: 'bg-status-submitted-bg text-status-submitted-text',
  'In-Progress': 'bg-status-progress-bg text-status-progress-text',
  'In Review': 'bg-status-pending-bg text-status-pending-text',
  RFI: 'bg-status-rfi-bg text-status-rfi-text',
  Completed: 'bg-status-completed-bg text-status-completed-text',
  Accepted: 'bg-status-accepted-bg text-status-accepted-text',
  Archived: 'bg-status-archived-bg text-status-archived-text',
  'Pending Inspection': 'bg-status-pending-bg text-status-pending-text',
  Inspected: 'bg-status-inspected-bg text-status-inspected-text',
  'Report Generation': 'bg-status-report-bg text-status-report-text',
  'Estimate Generation': 'bg-status-estimate-bg text-status-estimate-text',
  'Document Generation': 'bg-status-document-bg text-status-document-text',
  'In Revision': 'bg-status-revision-bg text-status-revision-text',
  Withdrawn: 'bg-status-withdrawn-bg text-status-withdrawn-text',
  Approved: 'bg-status-submitted-bg text-status-submitted-text',
  Rejected: 'bg-status-rfi-bg text-status-rfi-text',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-bg-tertiary text-text-secondary'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  )
}
