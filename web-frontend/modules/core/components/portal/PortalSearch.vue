<template>
  <div class="portal-search">
    <div class="portal-search__input-wrapper">
      <i class="iconoir-search" style="color: var(--color-neutral-500); font-size: 18px;"></i>
      <input
        v-model="searchQuery"
        class="portal-search__input"
        type="text"
        placeholder="Search all projects, and internal resources"
        @keydown.enter="$emit('search', searchQuery)"
      />
      <button
        class="portal-search__search-btn"
        @click="$emit('search', searchQuery)"
      >
        Search
      </button>
    </div>
    <div class="portal-search__quick-links">
      <span class="portal-search__quick-label">Quick Links</span>
      <a
        v-for="link in quickLinks"
        :key="link.label"
        :href="link.href"
        class="portal-search__quick-link"
        target="_blank"
      >
        <i class="iconoir-book-close"></i>
        {{ link.label }}
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PortalSearch',
  emits: ['search'],
  data() {
    return {
      searchQuery: '',
      quickLinks: [
        { label: 'Project Guidelines', href: '#' },
        { label: 'Internal Resources', href: '#' },
        { label: 'Library', href: '#' },
      ],
    }
  },
}
</script>
