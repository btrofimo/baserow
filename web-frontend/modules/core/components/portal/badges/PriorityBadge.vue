<template>
  <span class="portal-badge portal-badge--with-icon" :class="colorClass">
    <span class="portal-badge__icon">
      <i :class="iconClass"></i>
    </span>
    {{ priority }}
  </span>
</template>

<script>
const PRIORITY_CONFIG = {
  Normal: { color: 'portal-badge--gray', icon: 'iconoir-clock' },
  Medium: { color: 'portal-badge--warning', icon: 'iconoir-clock-plus' },
  High: { color: 'portal-badge--error', icon: 'iconoir-timer' },
}

export default {
  name: 'PriorityBadge',
  props: {
    priority: {
      type: String,
      required: true,
    },
  },
  computed: {
    config() {
      return PRIORITY_CONFIG[this.priority] || PRIORITY_CONFIG.Normal
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
