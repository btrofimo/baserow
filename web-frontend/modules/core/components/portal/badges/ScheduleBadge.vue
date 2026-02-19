<template>
  <span class="portal-badge portal-badge--with-icon" :class="colorClass">
    <span class="portal-badge__icon">
      <i :class="iconClass"></i>
    </span>
    {{ schedule }}
  </span>
</template>

<script>
const SCHEDULE_CONFIG = {
  'On Schedule': { color: 'portal-badge--gray', icon: 'iconoir-clock' },
  'Due Soon': { color: 'portal-badge--warning', icon: 'iconoir-clock' },
  'Overdue': { color: 'portal-badge--error', icon: 'iconoir-warning-square' },
}

export default {
  name: 'ScheduleBadge',
  props: {
    schedule: {
      type: String,
      required: true,
    },
  },
  computed: {
    config() {
      return SCHEDULE_CONFIG[this.schedule] || SCHEDULE_CONFIG['On Schedule']
    },
    colorClass() {
      return this.config.color
    },
    iconClass() {
      return this.config.icon
    },
  },
}
</script>
