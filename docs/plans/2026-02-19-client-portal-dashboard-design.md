# Client Portal Dashboard Design

**Date:** 2026-02-19
**Status:** Approved
**Approach:** A — New dedicated portal page

## Overview

Build a custom client portal dashboard that provides a project management view for TCR clients. This replaces the default Baserow workspace dashboard with a purpose-built dark-themed interface featuring a project data table, sidebar navigation, search, and color-coded badge components.

## Figma Source

File: `Kk6VseIOHBs6KCatNcn8Dr` (TCR UI Kit with Variables)

| Node ID | Description |
|---------|-------------|
| `17529:25961` | Dashboard/Home page — full layout with nav, sidebar, search, project table |
| `17616:24972` | Project Status badges — 14 color-coded status variants |
| `17617:25870` | Request type badges — 9 types with icons |
| `17617:25871` | Priority badges — 3 levels with icons |
| `17617:25872` | Schedule status badges — 3 states with icons |

## Architecture

### Approach

New route `/portal/:workspaceId` with dedicated components. The existing Baserow workspace dashboard remains untouched as fallback. Clean separation of portal code from core Baserow code for easier upstream maintenance.

### Component Structure

```
web-frontend/modules/core/
├── pages/
│   └── portal.vue                      # Main portal page
├── layouts/
│   └── portal.vue                      # Portal layout (top nav + content)
├── components/
│   └── portal/
│       ├── PortalNavbar.vue            # Top navigation bar
│       ├── PortalSidebar.vue           # Left sidebar (Projects counter, nav buttons)
│       ├── PortalSearch.vue            # Search bar + quick links
│       ├── ProjectTable.vue            # Data table with sortable columns
│       └── badges/
│           ├── ProjectStatusBadge.vue  # 14 project status variants
│           ├── RequestTypeBadge.vue    # 9 request types with icons
│           ├── PriorityBadge.vue       # 3 priority levels with icons
│           └── ScheduleBadge.vue       # 3 schedule states with icons
├── assets/scss/components/
│   └── portal/
│       ├── portal.scss                 # Main layout
│       ├── portal_navbar.scss          # Top nav
│       ├── portal_sidebar.scss         # Left sidebar
│       ├── portal_search.scss          # Search + quick links
│       ├── portal_table.scss           # Data table
│       └── portal_badges.scss          # All badge variants
└── routes.js                           # Add portal route
```

### Data Flow

1. User logs in, redirected to `/portal/:workspaceId`
2. Portal page fetches project data from a Baserow database table via `/api/database/rows/table/{tableId}/`
3. Table fields map to columns: Street, City/State/Zip, File No., Project Status, Priority, Request
4. Badge components render based on field values (single select → status/priority, linked/multi-select → request types)
5. Sidebar shows aggregate count of active projects

### Top Navigation Bar

From Figma (dark theme, `#1a1a2e` background):
- Left: Search icon + "Search ..." + keyboard shortcut badge (double-K)
- Center: Home, News, Support, More links
- Right: Notification bell, Help (?), Settings gear, Star/Upgrade button, User avatar, Close/cancel icon

### Left Sidebar

- "Projects" header with vertical dots menu icon
- "Active Projects" counter card (large number display)
- Action buttons (each with icon):
  - New Project (file-plus icon)
  - New Deliverable (file-plus icon)
  - Project Archive (archive icon)
  - Schedule (calendar icon)

### Search + Quick Links Section

- Full-width search input: "Search all projects, and internal resources"
- Quick Links row with pill buttons: "Project Guidelines", "Internal Resources", "Library" (each with book icon)

### Project Table

| Column | Field Type | Width | Notes |
|--------|-----------|-------|-------|
| Street | Text | ~200px | Address street |
| City, State Zip | Text | ~200px | Combined location |
| File No. | Text | ~120px | Project identifier (e.g., 2026-P086) |
| Project Status | Single Select | ~130px | Rendered as `ProjectStatusBadge` |
| Priority | Single Select | ~100px | Rendered as `PriorityBadge` |
| Request | Multi Select | ~250px | Rendered as multiple `RequestTypeBadge` pills |

Table headers use sort icons (ascending indicator). Rows have alternating dark backgrounds.

## Badge System

### Shared badge pattern

All badges share: `border-radius: 2px`, `padding: 4px 12px` (status) or `4px 10px 4px 12px` (with icon), `font-size: 11px`, `font-weight: 500`, `line-height: 12px`, `border: 1px solid`.

### Project Status Colors (14 variants)

| Status | BG | Border | Text | Color Family |
|--------|-----|--------|------|-------------|
| New Project | `#f8f9fc` | `#d5d9eb` | `#363f72` | gray-blue |
| New Request | `#f8f9fc` | `#d5d9eb` | `#363f72` | gray-blue |
| Pending Inspection | `#fffaeb` | `#fedf89` | `#b54708` | warning |
| Inspected | `#fef6ee` | `#f9dbaf` | `#b93815` | orange |
| Report Generation | `#fef6ee` | `#f9d1af` | `#b73817` | brand |
| Estimate Generation | `#fef6ee` | `#f9d1af` | `#b73817` | brand |
| Document Generation | `#fef6ee` | `#f9d1af` | `#b73817` | brand |
| Submitted | `#ecfdf3` | `#abefc6` | `#067647` | success |
| Accepted | `#ecfdf3` | `#abefc6` | `#067647` | success |
| Completed | `#fafafa` | `#e9eaeb` | `#454545` | gray |
| Archived | `#fafafa` | `#e9eaeb` | `#454545` | gray |
| In Revision | `#fdf2fa` | `#fcceee` | `#c11574` | pink |
| RFI | `#fef3f2` | `#fecdca` | `#b42318` | error |
| Withdrawn | `#fef3f2` | `#fecdca` | `#b42318` | error |

### Request Type Badges (9 variants, with icons)

| Type | Color Family | Icon |
|------|-------------|------|
| Estimate | gray-blue | bank-note-02 |
| Bid | gray-blue | bank-note-02 |
| General Document | gray-blue | file-04 |
| Engineering Report | brand (orange) | file-05 |
| Roof Report | brand (orange) | file-05 |
| Weather Analysis | blue-light | cloud-lightning |
| Photo Report | indigo | image-01 |
| Thermal Mapping | error (red) | dots-grid |
| Moisture Mapping | blue-light | dots-grid |

### Priority Badges (3 variants, with icons)

| Level | Color Family | Icon |
|-------|-------------|------|
| Normal | gray | clock |
| Medium | warning | clock-plus |
| High | error | clock-stopwatch |

### Schedule Badges (3 variants, with icons)

| State | Color Family | Icon |
|-------|-------------|------|
| On Schedule | gray | clock-check |
| Due Soon | warning | clock |
| Overdue | error | alert-square |

## Typography

- Font: Inter (matches existing codebase)
- Welcome heading: 20px SemiBold 600, line-height 28px
- Table header: 10px SemiBold 600, line-height 16px
- Table cell: 10px Bold 700, line-height 16px
- Badge text: 11px Medium 500, line-height 12px
- Sidebar counter label: 10px SemiBold 600
- Sidebar counter number: 20px SemiBold 600

## Color Palette (Dashboard-specific)

- Page background: `#0f0f0f` (dark)
- Sidebar background: `#1a1a1a` (slightly lighter dark)
- Navbar background: `#1a1a2e` (dark navy)
- Table header: `#1a1a1a`
- Table row: `#141414`
- Table row alt: `#1a1a1a`
- Table border: `rgba(255,255,255,0.06)`
- Text primary: `#f7f7f7`
- Text secondary: `#8a8a8a`

## Non-Goals

- No dark/light theme toggle for portal (always dark, matching Figma)
- No drag-to-reorder columns (initial version)
- No inline cell editing (view-only table)
- No real-time collaboration features
- No pagination (initial version shows all rows)
