# Client Portal Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a custom client portal dashboard at `/portal/:workspaceId` with a project data table, sidebar navigation, search bar, and color-coded badge components matching the TCR Figma designs.

**Architecture:** New dedicated portal page under the existing `root` route (inherits auth middleware). Portal-specific Vue components and SCSS live in `portal/` subdirectories. Data fetched from Baserow database tables via the existing `RowService` API.

**Tech Stack:** Vue 3 (Composition API), Nuxt 3, SCSS (BEM), Baserow REST API, Iconoir icons

**Design Doc:** `docs/plans/2026-02-19-client-portal-dashboard-design.md`

---

### Task 1: Add portal route and empty page shell

**Files:**
- Modify: `web-frontend/modules/core/routes.js:68-78` (add portal route inside `root` children)
- Create: `web-frontend/modules/core/pages/portal.vue`

**Step 1: Add the route**

In `web-frontend/modules/core/routes.js`, add a new child route inside the `root` children array, after the `workspace` route (line ~78):

```javascript
{
  name: 'portal',
  path: '/portal/:workspaceId',
  file: path.resolve(__dirname, 'pages/portal.vue'),
},
```

**Step 2: Create the empty portal page**

Create `web-frontend/modules/core/pages/portal.vue`:

```vue
<template>
  <div class="portal">
    <h1>Portal — workspace {{ $route.params.workspaceId }}</h1>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app',
  middleware: [
    'settings',
    'authenticated',
    'impersonate',
    'workspacesAndApplications',
  ],
})
</script>
```

**Step 3: Verify build compiles**

Run: `cd web-frontend && yarn build 2>&1 | tail -5`
Expected: Build succeeds without errors.

**Step 4: Commit**

```bash
git add web-frontend/modules/core/routes.js web-frontend/modules/core/pages/portal.vue
git commit -m "feat(portal): add empty portal page and route"
```

---

### Task 2: Create portal badge SCSS and badge components

**Files:**
- Create: `web-frontend/modules/core/assets/scss/components/portal/portal_badges.scss`
- Create: `web-frontend/modules/core/components/portal/badges/ProjectStatusBadge.vue`
- Create: `web-frontend/modules/core/components/portal/badges/PriorityBadge.vue`
- Create: `web-frontend/modules/core/components/portal/badges/ScheduleBadge.vue`
- Create: `web-frontend/modules/core/components/portal/badges/RequestTypeBadge.vue`
- Modify: `web-frontend/modules/core/assets/scss/components/all.scss` (add portal imports)

**Step 1: Create the portal badges SCSS**

Create `web-frontend/modules/core/assets/scss/components/portal/portal_badges.scss`:

```scss
// Portal badge base styles
.portal-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 2px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 500;
  line-height: 12px;
  white-space: nowrap;

  // Text-only badges (status)
  &--text-only {
    padding: 4px 12px;
  }

  // Badges with icon
  &--with-icon {
    padding: 4px 12px 4px 10px;
  }

  &__icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 16px;
    }
  }

  // ─── Color families ───

  // Gray-blue (New Project, New Request, Estimate, Bid, General Document)
  &--gray-blue {
    background: #f8f9fc;
    border-color: #d5d9eb;
    color: #363f72;
  }

  // Warning (Pending Inspection, Medium priority, Due Soon)
  &--warning {
    background: #fffaeb;
    border-color: #fedf89;
    color: #b54708;
  }

  // Orange (Inspected)
  &--orange {
    background: #fef6ee;
    border-color: #f9dbaf;
    color: #b93815;
  }

  // Brand (Report/Estimate/Document Generation, Engineering Report, Roof Report)
  &--brand {
    background: #fef6ee;
    border-color: #f9d1af;
    color: #b73817;
  }

  // Success (Submitted, Accepted)
  &--success {
    background: #ecfdf3;
    border-color: #abefc6;
    color: #067647;
  }

  // Gray (Completed, Archived, Normal priority, On Schedule)
  &--gray {
    background: #fafafa;
    border-color: #e9eaeb;
    color: #454545;
  }

  // Pink (In Revision)
  &--pink {
    background: #fdf2fa;
    border-color: #fcceee;
    color: #c11574;
  }

  // Error (RFI, Withdrawn, High priority, Overdue, Thermal Mapping)
  &--error {
    background: #fef3f2;
    border-color: #fecdca;
    color: #b42318;
  }

  // Blue-light (Weather Analysis, Moisture Mapping)
  &--blue-light {
    background: #f0f9ff;
    border-color: #b9e6fe;
    color: #026aa2;
  }

  // Indigo (Photo Report)
  &--indigo {
    background: #eef4ff;
    border-color: #c7d7fe;
    color: #3538cd;
  }
}
```

**Step 2: Create ProjectStatusBadge.vue**

Create `web-frontend/modules/core/components/portal/badges/ProjectStatusBadge.vue`:

```vue
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
```

**Step 3: Create PriorityBadge.vue**

Create `web-frontend/modules/core/components/portal/badges/PriorityBadge.vue`:

```vue
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
  Normal: {
    color: 'portal-badge--gray',
    icon: 'iconoir-clock',
  },
  Medium: {
    color: 'portal-badge--warning',
    icon: 'iconoir-clock-plus',
  },
  High: {
    color: 'portal-badge--error',
    icon: 'iconoir-timer',
  },
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
```

**Step 4: Create ScheduleBadge.vue**

Create `web-frontend/modules/core/components/portal/badges/ScheduleBadge.vue`:

```vue
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
  'On Schedule': {
    color: 'portal-badge--gray',
    icon: 'iconoir-clock',
  },
  'Due Soon': {
    color: 'portal-badge--warning',
    icon: 'iconoir-clock',
  },
  'Overdue': {
    color: 'portal-badge--error',
    icon: 'iconoir-warning-square',
  },
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
```

**Step 5: Create RequestTypeBadge.vue**

Create `web-frontend/modules/core/components/portal/badges/RequestTypeBadge.vue`:

```vue
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
  Estimate: {
    color: 'portal-badge--gray-blue',
    icon: 'iconoir-bank-note',
  },
  Bid: {
    color: 'portal-badge--gray-blue',
    icon: 'iconoir-bank-note',
  },
  'General Document': {
    color: 'portal-badge--gray-blue',
    icon: 'iconoir-page',
  },
  'Engineering Report': {
    color: 'portal-badge--brand',
    icon: 'iconoir-page',
  },
  'Roof Report': {
    color: 'portal-badge--brand',
    icon: 'iconoir-page',
  },
  'Weather Analysis': {
    color: 'portal-badge--blue-light',
    icon: 'iconoir-cloud-sunny',
  },
  'Photo Report': {
    color: 'portal-badge--indigo',
    icon: 'iconoir-media-image',
  },
  'Thermal Mapping': {
    color: 'portal-badge--error',
    icon: 'iconoir-grid-plus',
  },
  'Moisture Mapping': {
    color: 'portal-badge--blue-light',
    icon: 'iconoir-grid-plus',
  },
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
      return REQUEST_CONFIG[this.type] || {
        color: 'portal-badge--gray',
        icon: 'iconoir-page',
      }
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
```

**Step 6: Register SCSS imports**

In `web-frontend/modules/core/assets/scss/components/all.scss`, add at the end of the file:

```scss
@import 'portal/portal_badges';
```

**Step 7: Verify build compiles**

Run: `cd web-frontend && yarn build 2>&1 | tail -5`
Expected: Build succeeds without errors.

**Step 8: Commit**

```bash
git add web-frontend/modules/core/components/portal/badges/ \
        web-frontend/modules/core/assets/scss/components/portal/portal_badges.scss \
        web-frontend/modules/core/assets/scss/components/all.scss
git commit -m "feat(portal): add badge components for status, priority, schedule, request"
```

---

### Task 3: Create PortalSidebar component

**Files:**
- Create: `web-frontend/modules/core/components/portal/PortalSidebar.vue`
- Create: `web-frontend/modules/core/assets/scss/components/portal/portal_sidebar.scss`
- Modify: `web-frontend/modules/core/assets/scss/components/all.scss` (add import)

**Step 1: Create sidebar SCSS**

Create `web-frontend/modules/core/assets/scss/components/portal/portal_sidebar.scss`:

```scss
.portal-sidebar {
  width: 230px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      font-size: 18px;
      color: $color-neutral-500;
    }
  }

  &__title {
    font-size: 12px;
    font-weight: 700;
    color: $color-neutral-900;
  }

  &__more-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: $color-neutral-500;
    padding: 4px;
    display: flex;
    align-items: center;

    i {
      font-size: 18px;
    }
  }

  &__counter {
    background: themed-alpha($color-neutral-900, 0.06);
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }

  &__counter-label {
    font-size: 10px;
    font-weight: 600;
    color: $color-primary-text;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__counter-value {
    font-size: 20px;
    font-weight: 600;
    color: $color-neutral-900;
    line-height: 28px;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background: $color-primary-500;
    transition: opacity 0.15s;
    width: 100%;
    text-align: left;

    &:hover {
      opacity: 0.9;
    }

    i {
      font-size: 16px;
    }

    &--secondary {
      background: themed-alpha($color-neutral-900, 0.06);
      color: $color-neutral-900;

      &:hover {
        background: themed-alpha($color-neutral-900, 0.1);
      }
    }
  }
}
```

**Step 2: Create PortalSidebar.vue**

Create `web-frontend/modules/core/components/portal/PortalSidebar.vue`:

```vue
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
```

**Step 3: Add SCSS import**

In `web-frontend/modules/core/assets/scss/components/all.scss`, add after the portal_badges import:

```scss
@import 'portal/portal_sidebar';
```

**Step 4: Verify build compiles**

Run: `cd web-frontend && yarn build 2>&1 | tail -5`

**Step 5: Commit**

```bash
git add web-frontend/modules/core/components/portal/PortalSidebar.vue \
        web-frontend/modules/core/assets/scss/components/portal/portal_sidebar.scss \
        web-frontend/modules/core/assets/scss/components/all.scss
git commit -m "feat(portal): add sidebar with project counter and action buttons"
```

---

### Task 4: Create PortalSearch component

**Files:**
- Create: `web-frontend/modules/core/components/portal/PortalSearch.vue`
- Create: `web-frontend/modules/core/assets/scss/components/portal/portal_search.scss`
- Modify: `web-frontend/modules/core/assets/scss/components/all.scss` (add import)

**Step 1: Create search SCSS**

Create `web-frontend/modules/core/assets/scss/components/portal/portal_search.scss`:

```scss
.portal-search {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__input-wrapper {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 100px;
    padding: 0 16px;
    height: 44px;
    gap: 12px;
  }

  &__input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: $color-neutral-900;
    font-size: 13px;

    &::placeholder {
      color: $color-neutral-500;
    }
  }

  &__search-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 6px 16px;
    color: $color-neutral-900;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  &__quick-links {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__quick-label {
    font-size: 12px;
    font-weight: 700;
    color: $color-neutral-900;
    white-space: nowrap;
  }

  &__quick-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: $color-neutral-900;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;

    i {
      font-size: 14px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}
```

**Step 2: Create PortalSearch.vue**

Create `web-frontend/modules/core/components/portal/PortalSearch.vue`:

```vue
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
```

**Step 3: Add SCSS import**

In `web-frontend/modules/core/assets/scss/components/all.scss`, add after the portal_sidebar import:

```scss
@import 'portal/portal_search';
```

**Step 4: Verify build, commit**

```bash
cd web-frontend && yarn build 2>&1 | tail -5
git add web-frontend/modules/core/components/portal/PortalSearch.vue \
        web-frontend/modules/core/assets/scss/components/portal/portal_search.scss \
        web-frontend/modules/core/assets/scss/components/all.scss
git commit -m "feat(portal): add search bar with quick links"
```

---

### Task 5: Create ProjectTable component

**Files:**
- Create: `web-frontend/modules/core/components/portal/ProjectTable.vue`
- Create: `web-frontend/modules/core/assets/scss/components/portal/portal_table.scss`
- Modify: `web-frontend/modules/core/assets/scss/components/all.scss` (add import)

**Step 1: Create table SCSS**

Create `web-frontend/modules/core/assets/scss/components/portal/portal_table.scss`:

```scss
.portal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;

  &__head {
    th {
      padding: 10px 16px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: $color-neutral-500;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      white-space: nowrap;
      user-select: none;
    }
  }

  &__sort-icon {
    display: inline-flex;
    margin-left: 4px;
    font-size: 10px;
    vertical-align: middle;
    opacity: 0.5;
  }

  &__body {
    tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);

      &:nth-child(even) {
        background: rgba(255, 255, 255, 0.02);
      }

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }
    }

    td {
      padding: 12px 16px;
      font-size: 10px;
      font-weight: 700;
      color: $color-neutral-900;
      vertical-align: middle;
    }
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  // Wrapper for scrolling on small screens
  &-wrapper {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
}
```

**Step 2: Create ProjectTable.vue**

Create `web-frontend/modules/core/components/portal/ProjectTable.vue`:

```vue
<template>
  <div class="portal-table-wrapper">
    <table class="portal-table">
      <thead class="portal-table__head">
        <tr>
          <th>
            <i class="iconoir-text" style="font-size: 10px; margin-right: 4px;"></i>
            Street
            <span class="portal-table__sort-icon"><i class="iconoir-sort-up"></i></span>
          </th>
          <th>
            <i class="iconoir-text" style="font-size: 10px; margin-right: 4px;"></i>
            City, State Zip
          </th>
          <th>
            <i class="iconoir-hashtag" style="font-size: 10px; margin-right: 4px;"></i>
            File No.
          </th>
          <th>
            <i class="iconoir-circle" style="font-size: 10px; margin-right: 4px;"></i>
            Project Status
          </th>
          <th>
            <i class="iconoir-circle" style="font-size: 10px; margin-right: 4px;"></i>
            Priority
          </th>
          <th>
            <i class="iconoir-circle" style="font-size: 10px; margin-right: 4px;"></i>
            Request
          </th>
        </tr>
      </thead>
      <tbody class="portal-table__body">
        <tr v-for="row in rows" :key="row.id">
          <td>{{ getFieldValue(row, 'street') }}</td>
          <td>{{ getFieldValue(row, 'city_state_zip') }}</td>
          <td>{{ getFieldValue(row, 'file_no') }}</td>
          <td>
            <ProjectStatusBadge
              v-if="getSelectValue(row, 'project_status')"
              :status="getSelectValue(row, 'project_status')"
            />
          </td>
          <td>
            <PriorityBadge
              v-if="getSelectValue(row, 'priority')"
              :priority="getSelectValue(row, 'priority')"
            />
          </td>
          <td>
            <div class="portal-table__badges">
              <RequestTypeBadge
                v-for="reqType in getMultiSelectValues(row, 'request')"
                :key="reqType"
                :type="reqType"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import ProjectStatusBadge from '@baserow/modules/core/components/portal/badges/ProjectStatusBadge'
import PriorityBadge from '@baserow/modules/core/components/portal/badges/PriorityBadge'
import RequestTypeBadge from '@baserow/modules/core/components/portal/badges/RequestTypeBadge'

export default {
  name: 'ProjectTable',
  components: {
    ProjectStatusBadge,
    PriorityBadge,
    RequestTypeBadge,
  },
  props: {
    rows: {
      type: Array,
      default: () => [],
    },
    fieldMap: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    getFieldValue(row, fieldKey) {
      const fieldId = this.fieldMap[fieldKey]
      if (!fieldId) return ''
      return row[`field_${fieldId}`] || ''
    },
    getSelectValue(row, fieldKey) {
      const fieldId = this.fieldMap[fieldKey]
      if (!fieldId) return ''
      const val = row[`field_${fieldId}`]
      if (!val) return ''
      // Single select returns { id, value, color }
      return typeof val === 'object' ? val.value : val
    },
    getMultiSelectValues(row, fieldKey) {
      const fieldId = this.fieldMap[fieldKey]
      if (!fieldId) return []
      const val = row[`field_${fieldId}`]
      if (!val) return []
      // Multi-select returns array of { id, value, color }
      if (Array.isArray(val)) {
        return val.map((v) => (typeof v === 'object' ? v.value : v))
      }
      return []
    },
  },
}
</script>
```

**Step 3: Add SCSS import**

In `web-frontend/modules/core/assets/scss/components/all.scss`, add after the portal_search import:

```scss
@import 'portal/portal_table';
```

**Step 4: Verify build, commit**

```bash
cd web-frontend && yarn build 2>&1 | tail -5
git add web-frontend/modules/core/components/portal/ProjectTable.vue \
        web-frontend/modules/core/assets/scss/components/portal/portal_table.scss \
        web-frontend/modules/core/assets/scss/components/all.scss
git commit -m "feat(portal): add project data table with badge rendering"
```

---

### Task 6: Create main portal page layout and SCSS

**Files:**
- Create: `web-frontend/modules/core/assets/scss/components/portal/portal.scss`
- Modify: `web-frontend/modules/core/pages/portal.vue` (full implementation)
- Modify: `web-frontend/modules/core/assets/scss/components/all.scss` (add import)

**Step 1: Create portal layout SCSS**

Create `web-frontend/modules/core/assets/scss/components/portal/portal.scss`:

```scss
.portal {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0f0f0f;
  color: $color-neutral-900;

  &__welcome {
    text-align: center;
    padding: 40px 24px 24px;
  }

  &__welcome-text {
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    color: $color-neutral-900;
  }

  &__content {
    padding: 0 40px 40px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
  }

  &__body {
    display: flex;
    gap: 24px;
    flex: 1;
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  // Loading state
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    color: $color-neutral-500;
    font-size: 14px;
  }

  // Error state
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 80px 24px;
    color: $color-neutral-500;
    font-size: 14px;
    text-align: center;
  }
}
```

**Step 2: Implement portal.vue**

Overwrite `web-frontend/modules/core/pages/portal.vue` with the full implementation. This is the core page that ties together all the portal components.

The page uses `useAsyncData` to:
1. Select the workspace by ID (same pattern as `workspace.vue`)
2. Discover database tables in the workspace
3. Fetch rows from the first table (the "Projects" table)
4. Map field names to field IDs for the ProjectTable component

```vue
<template>
  <div class="portal">
    <div class="portal__welcome">
      <h1 class="portal__welcome-text">
        Hey, Welcome {{ userName }}.
      </h1>
    </div>

    <div class="portal__content">
      <PortalSearch @search="handleSearch" />

      <div class="portal__body">
        <PortalSidebar :active-count="activeProjectCount" />

        <div class="portal__main">
          <div v-if="loading" class="portal__loading">
            Loading projects...
          </div>
          <div v-else-if="errorMessage" class="portal__error">
            <p>{{ errorMessage }}</p>
          </div>
          <ProjectTable
            v-else
            :rows="filteredRows"
            :field-map="fieldMap"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useNuxtApp, createError } from '#app'
import { useHead, useAsyncData } from '#imports'

import PortalSidebar from '@baserow/modules/core/components/portal/PortalSidebar'
import PortalSearch from '@baserow/modules/core/components/portal/PortalSearch'
import ProjectTable from '@baserow/modules/core/components/portal/ProjectTable'
import RowService from '@baserow/modules/database/services/row'

definePageMeta({
  layout: 'app',
  middleware: [
    'settings',
    'authenticated',
    'impersonate',
    'workspacesAndApplications',
  ],
})

const route = useRoute()
const { $store, $client, $i18n } = useNuxtApp()

useHead(() => ({
  title: 'Portal',
}))

const searchQuery = ref('')
const loading = ref(false)
const errorMessage = ref('')
const rows = ref([])
const fieldMap = ref({})

const userName = computed(() => {
  const user = $store.getters['auth/getName']
  return user || 'User'
})

// Find the first database table in this workspace to use as the project table.
// In a real deployment, you'd configure which table ID to use via settings.
const workspaceId = parseInt(route.params.workspaceId, 10)

const { pending } = await useAsyncData(
  `portal-${workspaceId}`,
  async () => {
    loading.value = true
    errorMessage.value = ''

    try {
      await $store.dispatch('workspace/selectById', workspaceId)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workspace not found.',
      })
    }

    // Get all applications (databases) in this workspace
    const apps = $store.getters['application/getAllOfWorkspace'](
      $store.getters['workspace/getSelected']
    )

    // Find the first database application
    const database = apps.find((app) => app.type === 'database')
    if (!database || !database.tables || database.tables.length === 0) {
      loading.value = false
      errorMessage.value = 'No project database found in this workspace.'
      return { rows: [], fieldMap: {} }
    }

    // Use the first table as the projects table
    const table = database.tables[0]
    const tableId = table.id

    // Build field map from field names to IDs
    // The API returns fields with names, we map common patterns
    const fields = table.fields || []
    const fMap = {}
    for (const field of fields) {
      const name = field.name.toLowerCase()
      if (name.includes('street')) fMap.street = field.id
      else if (name.includes('city') || name.includes('state')) fMap.city_state_zip = field.id
      else if (name.includes('file') && name.includes('no')) fMap.file_no = field.id
      else if (name.includes('status')) fMap.project_status = field.id
      else if (name.includes('priority')) fMap.priority = field.id
      else if (name.includes('request') || name.includes('deliverable')) fMap.request = field.id
    }
    fieldMap.value = fMap

    // Fetch all rows
    const { data } = await RowService($client).fetchAll({
      tableId,
      page: 1,
      size: 200,
    })

    rows.value = data.results || []
    loading.value = false
    return { rows: data.results, fieldMap: fMap }
  }
)

const filteredRows = computed(() => {
  if (!searchQuery.value) return rows.value
  const q = searchQuery.value.toLowerCase()
  return rows.value.filter((row) => {
    return Object.values(row).some((val) => {
      if (typeof val === 'string') return val.toLowerCase().includes(q)
      if (typeof val === 'object' && val !== null) {
        if (val.value) return val.value.toLowerCase().includes(q)
        if (Array.isArray(val)) {
          return val.some((v) => v.value && v.value.toLowerCase().includes(q))
        }
      }
      return false
    })
  })
})

const activeProjectCount = computed(() => {
  return rows.value.filter((row) => {
    const statusFieldId = fieldMap.value.project_status
    if (!statusFieldId) return true
    const status = row[`field_${statusFieldId}`]
    if (!status) return true
    const val = typeof status === 'object' ? status.value : status
    return !['Completed', 'Archived', 'Withdrawn'].includes(val)
  }).length
})

function handleSearch(query) {
  searchQuery.value = query
}
</script>
```

**Step 3: Add SCSS import**

In `web-frontend/modules/core/assets/scss/components/all.scss`, add after the portal_table import:

```scss
@import 'portal/portal';
```

**Step 4: Verify build compiles**

Run: `cd web-frontend && yarn build 2>&1 | tail -5`
Expected: Build succeeds without errors.

**Step 5: Commit**

```bash
git add web-frontend/modules/core/pages/portal.vue \
        web-frontend/modules/core/assets/scss/components/portal/portal.scss \
        web-frontend/modules/core/assets/scss/components/all.scss
git commit -m "feat(portal): implement main portal page with data fetching and layout"
```

---

### Task 7: Add portal navbar SCSS (using existing app layout)

The portal page uses `layout: 'app'` which already includes the existing sidebar and top-level layout. The Figma shows a custom top navbar, but for the initial implementation we reuse the existing app layout sidebar. This task adds portal-specific navbar styling that can be extended later.

**Files:**
- Create: `web-frontend/modules/core/assets/scss/components/portal/portal_navbar.scss`
- Modify: `web-frontend/modules/core/assets/scss/components/all.scss` (add import)

**Step 1: Create navbar SCSS**

Create `web-frontend/modules/core/assets/scss/components/portal/portal_navbar.scss`:

```scss
// Portal-specific overrides when inside the portal page.
// The portal uses the existing app layout but applies dark styling overrides.
.portal {
  // Override the layout column 2 background for the portal
  & + .layout__col-2,
  & {
    background: #0f0f0f;
  }
}
```

**Step 2: Add SCSS import**

In `web-frontend/modules/core/assets/scss/components/all.scss`, add after the portal import:

```scss
@import 'portal/portal_navbar';
```

**Step 3: Verify build, commit**

```bash
cd web-frontend && yarn build 2>&1 | tail -5
git add web-frontend/modules/core/assets/scss/components/portal/portal_navbar.scss \
        web-frontend/modules/core/assets/scss/components/all.scss
git commit -m "feat(portal): add portal navbar styling overrides"
```

---

### Task 8: Add i18n keys for portal

**Files:**
- Modify: `web-frontend/modules/core/locales/en.json`

**Step 1: Add portal i18n keys**

In `web-frontend/modules/core/locales/en.json`, add a new `"portal"` section (find a logical place near the `"dashboard"` section):

```json
"portal": {
  "title": "Client Portal",
  "welcome": "Hey, Welcome {name}.",
  "searchPlaceholder": "Search all projects, and internal resources",
  "search": "Search",
  "quickLinks": "Quick Links",
  "projectGuidelines": "Project Guidelines",
  "internalResources": "Internal Resources",
  "library": "Library",
  "projects": "Projects",
  "activeProjects": "Active Projects",
  "newProject": "New Project",
  "newDeliverable": "New Deliverable",
  "projectArchive": "Project Archive",
  "schedule": "Schedule",
  "loading": "Loading projects...",
  "noDatabase": "No project database found in this workspace.",
  "street": "Street",
  "cityStateZip": "City, State Zip",
  "fileNo": "File No.",
  "projectStatus": "Project Status",
  "priority": "Priority",
  "request": "Request"
}
```

**Step 2: Commit**

```bash
git add web-frontend/modules/core/locales/en.json
git commit -m "feat(portal): add i18n keys for portal components"
```

---

### Task 9: Redirect authenticated users to portal by default

**Files:**
- Modify: `web-frontend/modules/core/pages/index.vue`

**Step 1: Read current index.vue**

Read `web-frontend/modules/core/pages/index.vue` to understand current redirect logic.

**Step 2: Update redirect to use portal route**

The index page should redirect authenticated users to `/portal/:workspaceId` instead of `/workspace/:workspaceId`. Update the redirect logic so that when a user has a selected workspace, they go to the portal view.

Note: Only change the redirect target. Keep all existing logic (auth check, workspace selection, fallback to dashboard) intact.

**Step 3: Verify build, commit**

```bash
cd web-frontend && yarn build 2>&1 | tail -5
git add web-frontend/modules/core/pages/index.vue
git commit -m "feat(portal): redirect authenticated users to portal view"
```

---

### Task 10: Visual polish and Figma QA

**Files:**
- Modify: Various portal SCSS files as needed based on visual comparison

**Step 1: Build and run locally**

Start the dev server and navigate to `/portal/:workspaceId` to see the page.

Run: `cd web-frontend && yarn dev`

**Step 2: Compare with Figma screenshots**

Use the Figma MCP tool to fetch screenshots of node `17529:25961` and compare with the local implementation. Look for:
- Spacing and padding discrepancies
- Font size and weight mismatches
- Color differences
- Badge appearance vs Figma
- Table layout vs Figma

**Step 3: Fix any visual discrepancies**

Adjust SCSS values to match Figma exactly. Common things to check:
- Welcome heading size and spacing
- Search bar height and border-radius
- Sidebar width and counter card styling
- Table header/cell sizes
- Badge padding and border-radius

**Step 4: Commit**

```bash
git add -A
git commit -m "fix(portal): visual polish to match Figma designs"
```

---

### Task 11: Final build verification

**Step 1: Run full build**

Run: `cd web-frontend && yarn build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

**Step 2: Verify all portal SCSS imports are registered**

Check that `all.scss` has all 5 portal imports:
```
portal/portal_badges
portal/portal_sidebar
portal/portal_search
portal/portal_table
portal/portal
portal/portal_navbar
```

**Step 3: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix(portal): final build fixes"
```
