<template>
  <span class="portal-badge portal-badge--text-only" :class="colorClass">
    {{ status }}
  </span>
</template>

<script>
const STATUS_COLORS = {
  'New Project': 'portal-badge--gray-blue',
  'New Request': 'portal-badge--gray-blue',
  'Pending Inspection': 'portal-badge--warning',
  'Inspected': 'portal-badge--orange',
  'Report Generation': 'portal-badge--brand',
  'Estimate Generation': 'portal-badge--brand',
  'Document Generation': 'portal-badge--brand',
  'Submitted': 'portal-badge--success',
  'Accepted': 'portal-badge--success',
  'Completed': 'portal-badge--gray',
  'Archived': 'portal-badge--gray',
  'In Revision': 'portal-badge--pink',
  'RFI': 'portal-badge--error',
  'Withdrawn': 'portal-badge--error',
}

export default {
  name: 'ProjectStatusBadge',
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  computed: {
    colorClass() {
      return STATUS_COLORS[this.status] || 'portal-badge--gray'
    },
  },
}
</script>
