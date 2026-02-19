<template>
  <span class="portal-badge portal-badge--with-icon" :class="colorClass">
    <span class="portal-badge__icon">
      <i :class="iconClass"></i>
    </span>
    {{ type }}
  </span>
</template>

<script>
const REQUEST_CONFIG = {
  Estimate: { color: 'portal-badge--gray-blue', icon: 'iconoir-bank-note' },
  Bid: { color: 'portal-badge--gray-blue', icon: 'iconoir-bank-note' },
  'General Document': { color: 'portal-badge--gray-blue', icon: 'iconoir-page' },
  'Engineering Report': { color: 'portal-badge--brand', icon: 'iconoir-page' },
  'Roof Report': { color: 'portal-badge--brand', icon: 'iconoir-page' },
  'Weather Analysis': { color: 'portal-badge--blue-light', icon: 'iconoir-cloud-sunny' },
  'Photo Report': { color: 'portal-badge--indigo', icon: 'iconoir-media-image' },
  'Thermal Mapping': { color: 'portal-badge--error', icon: 'iconoir-grid-plus' },
  'Moisture Mapping': { color: 'portal-badge--blue-light', icon: 'iconoir-grid-plus' },
}

export default {
  name: 'RequestTypeBadge',
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  computed: {
    config() {
      return REQUEST_CONFIG[this.type] || { color: 'portal-badge--gray', icon: 'iconoir-page' }
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
