<template>
  <aside class="portal-sidebar">
    <div class="portal-sidebar__header">
      <div class="portal-sidebar__header-left">
        <i class="iconoir-table-rows"></i>
        <span class="portal-sidebar__title">Projects</span>
      </div>
      <button class="portal-sidebar__more-btn">
        <i class="iconoir-more-vert"></i>
      </button>
    </div>

    <div class="portal-sidebar__counter">
      <div class="portal-sidebar__counter-label">Active Projects</div>
      <div class="portal-sidebar__counter-value">{{ activeCount }}</div>
    </div>

    <div class="portal-sidebar__actions">
      <button class="portal-sidebar__action-btn">
        <i class="iconoir-page-plus"></i>
        New Project
      </button>
      <button class="portal-sidebar__action-btn">
        <i class="iconoir-page-plus"></i>
        New Deliverable
      </button>
      <button class="portal-sidebar__action-btn portal-sidebar__action-btn--secondary">
        <i class="iconoir-archive"></i>
        Project Archive
      </button>
      <button class="portal-sidebar__action-btn portal-sidebar__action-btn--secondary">
        <i class="iconoir-calendar-plus"></i>
        Schedule
      </button>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'PortalSidebar',
  props: {
    activeCount: {
      type: Number,
      default: 0,
    },
  },
}
</script>
