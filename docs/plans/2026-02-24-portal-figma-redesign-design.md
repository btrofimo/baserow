# Portal Figma Redesign Design

**Date:** 2026-02-24
**Status:** Approved
**Scope:** Client portal only, displaying Airtable data, matching TCR UI Kit Figma

## Context

The portal currently uses a light theme with basic Tailwind styling. The Figma design
(TCR UI Kit w/ Variables) defines a dark-themed professional application with sidebar
navigation, tabbed layouts, color-coded badges, and aerial photography backgrounds.

This redesign applies the Figma's visual language to the existing client portal while
keeping the same data source (Airtable) and audience (clients viewing their projects).

## Decisions

- **Audience:** Client portal only
- **Scope:** Visual redesign + sidebar nav + dashboard (no new content features like document upload or photo gallery yet)
- **Auth backgrounds:** Static bundled stock aerial photos, rotated randomly
- **Sidebar:** Projects-focused with year groupings from Airtable data
- **Project fields:** Show all Airtable fields in Figma's two-column grid
- **Approach:** Big bang redesign — build design system, then re-skin all screens in one pass

## 1. Design System Foundation

### Color Tokens (CSS custom properties)

```css
--bg-primary: #141414;       /* main background */
--bg-secondary: #1e1e1e;     /* cards, sidebar */
--bg-tertiary: #2a2a2a;      /* elevated surfaces, inputs */
--border-default: #333333;   /* dividers, borders */
--border-focus: #dc4b1a;     /* orange focus rings */
--text-primary: #ffffff;
--text-secondary: #a0a0a0;
--text-muted: #666666;
--accent-orange: #dc4b1a;    /* primary CTA */
--accent-orange-hover: #c54318;
--accent-gold: #c5962a;      /* In-Progress status */
```

### Status Badge Colors

| Status | Background | Text |
|--------|-----------|------|
| New Project | #dbeafe (blue-100) | #1e40af (blue-800) |
| Submitted | #dcfce7 (green-100) | #166534 (green-800) |
| In-Progress | #c5962a bg | #000 text |
| RFI | #fecaca (red-100) | #991b1b (red-800) |
| Completed | #f3f4f6 (gray-100) | #374151 (gray-700) |
| Archived | #374151 bg | #d1d5db text |
| Pending Inspection | #fef3c7 (amber-100) | #92400e (amber-800) |
| In Revision | #fce7f3 (pink-100) | #9d174d (pink-800) |
| Withdrawn | #f3f4f6 (gray-100) | #6b7280 (gray-500) |

### Priority Badge Colors

| Priority | Icon Color | Style |
|----------|-----------|-------|
| Normal | gray | outlined |
| Medium | orange | outlined |
| High | red | filled red bg |

### Request Type Tag Colors

| Tag | Color |
|-----|-------|
| Engineering Report | red chip |
| Estimate | gray chip |
| Weather Analysis | blue chip |
| Roof Report | red chip |
| Photo Report | green chip |
| Thermal Mapping | purple chip |
| Moisture Mapping | blue chip |
| Bid | gray chip |
| General Document | gray chip |

### Typography

System font stack: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

- H1: 24px bold white
- H2: 20px bold white
- H3: 16px semibold white
- Body: 14px regular text-secondary
- Label: 12px medium text-muted, uppercase tracking-wide
- Small: 12px regular text-muted

### Shared Components

- **Button**: primary (orange filled rounded-lg), secondary (border outlined), ghost (text only)
- **Input**: bg-tertiary, text-primary, border-default, focus:border-focus with orange ring
- **Select**: custom dropdown, searchable, orange focus border, checkmark on selected
- **Badge**: status (12+ variants), priority (3 variants), request type tags (9+ variants)
- **Card**: bg-secondary, border border-default, rounded-xl
- **Tabs**: horizontal tab bar, orange text+underline for active, gray for inactive
- **Table**: dark rows, hover:bg-tertiary, header uppercase text-muted

## 2. Layout Shell

### Structure

```
┌──────────────────────────────────────────────┐
│  Top Nav Bar (h-14, bg-secondary)            │
│  [hamburger/breadcrumb]       [bell][?][user]│
├────────┬─────────────────────────────────────┤
│Sidebar │  Content Area (bg-primary)          │
│(w-60)  │  (scrollable, padded)               │
│        │                                     │
│ TCR    │                                     │
│ Search │                                     │
│Projects│                                     │
│ ▾ 2026 │                                     │
│ ▾ 2025 │                                     │
│ Archive│                                     │
│Submit  │                                     │
│        │                                     │
│Settings│                                     │
│[user]  │                                     │
└────────┴─────────────────────────────────────┘
```

- **Sidebar** (w-60, collapsible to w-16 icon-only):
  - TCR orange wordmark logo
  - Search input with orange accent
  - Projects nav with year grouping (from Airtable project dates)
  - Submit New Project link
  - Bottom: Settings, user profile (avatar + email)
- **Top Nav** (h-14, fixed):
  - Left: hamburger (mobile) or breadcrumb path
  - Right: user avatar dropdown (sign out)
- **Content Area**: scrollable, renders current route
- **Auth pages bypass this layout** — use their own split-panel layout
- **Responsive**: sidebar hidden on mobile, hamburger toggle, content full-width

## 3. Auth Pages

### Login (`/auth/login`)

Split layout: left dark panel (45%) + right aerial photo (55%).

Left panel contents:
- TCR orange wordmark logo (top)
- "Log in" heading (bold, white, large)
- "Welcome back! Please enter your details." subtitle (text-secondary)
- Email input (floating label)
- Password input (floating label)
- Row: "Remember for 30 days" checkbox + "Forgot password" link (orange)
- "Sign in" button (full-width, orange, rounded-lg)
- Footer: "© TCR CG, PLLC"

Right panel: randomized stock aerial photo, full-height, object-cover.

### Forgot Password (`/auth/forgot-password`)

Same split layout. Multi-step flow with step indicator dots:

1. **Enter email** — key icon, "Forgot password?" heading, email input, "Reset password" button, "Back to log in" link
2. **Check email** — envelope icon, "Check your email" heading, destination text, "Open email app" button, "Didn't receive? Click to resend" link
3. **Set new password** — lock icon, "Set new password" heading, password + confirm inputs, requirement checklist (8+ chars, special char), "Reset password" button
4. **Success** — checkmark icon, "Password reset" heading, "Continue" button

### Change Password (NEW_PASSWORD_REQUIRED challenge)

Same split layout. Lock icon, "Set new password" heading, same password form as step 3 above.

## 4. Dashboard Home Page (New Route: `/projects` or `/`)

After login, the main landing page:

- Welcome banner: "Hey, Welcome [user.email]." on a subtle card
- Global search bar (searches projects by address/file no)
- Dashboard cards grid (2-3 columns):
  - **Active Projects**: count badge, "Go to Projects" arrow link
  - **Submit New**: CTA card linking to `/projects/submit`
  - Future placeholders: Documents, Resources (grayed out "Coming Soon")

Data from existing `listProjects` server function.

## 5. Projects List (`/projects/list` or nested under dashboard)

### Tab Bar
- Active | Completed | Archive
- Tabs filter by Airtable status field groupings:
  - Active: New Project, Submitted, In-Progress, RFI, Pending Inspection, In Revision
  - Completed: Completed, Accepted
  - Archive: Archived, Withdrawn

### Table
- Dark theme (bg-secondary rows, bg-tertiary hover)
- Columns: Street, City/State/Zip, File No, Status, Priority, Request Type
- Status: color-coded Badge component
- Priority: icon + text Badge
- Request Type: array of colored tag chips
- Header: uppercase text-muted labels, sortable columns
- "+ New Project" orange button top-right
- Existing TanStack Table sorting + pagination preserved

## 6. Project Detail (`/projects/$projectId`)

### Header
- "< BACK TO PROJECTS" link (top-left, orange)
- File number with icon + status badge
- Project photo (from Airtable attachment if exists, else placeholder aerial) on right side

### Tabs
- **Project Details** | Documents | Photos | **Activity**
- Documents and Photos: "Coming Soon" empty state

### Project Details Tab
Two-column grid displaying all Airtable fields:

| Left Column | Right Column |
|-------------|-------------|
| Status (gold pill for In-Progress) | |
| File No | DOL | Hail Size |
| County | Coordinates |
| Owner Company | Owner POC |
| Company | POC |
| Roof Area | Roofing System (gold pill) |
| No. RTUs | Insulation (dark pills) |
| Additional notes | |

**Inspection Notes** section below grid: date field + rich text area.

Fields with no data in Airtable are hidden (not shown as empty).

### Activity Tab
- Restyled existing CommentThread as activity log entries
- Each entry: author name (orange), timestamp, message body
- Message input at bottom: text area + send button (orange arrow icon)
- Attachment icon (future, disabled for now)

## 7. Submit Form (`/projects/submit`)

Dark theme form matching Figma layout:

- **Address** section: existing AddressAutocomplete (restyled dark), City/State/Zip auto-populated
- **Claim No**: text input
- **DOL**: date input
- **Request Type**: checkbox grid (Engineering Report, Estimate, Weather Data, General Document, Retail Bid, Measurements, Research, Other with text field)
- **Owner Company**: text input
- **Owner**: text input
- **Access**: text input ("Ladder, Hatch, Attached Ladder, etc.")
- **Will access need to be requested?**: text input ("Yes, No")
- **Additional Comments**: textarea
- **Priority**: custom select dropdown (Normal, Medium, High)
- Footer: Cancel (ghost button) + Save (orange button)

All fields map to Airtable columns via existing `submitProject` server function (will need to add new field mappings for the additional fields).

## Execution Order

1. Design system foundation (CSS tokens in app.css, shared component files)
2. Layout shell (Sidebar, TopNav, AppLayout wrapper)
3. Auth pages (login, forgot password — split layout)
4. Dashboard home page
5. Projects list (dark table, tabs, badges)
6. Project detail (two-column grid, tabbed layout)
7. Submit form (dark theme, enhanced fields)

## Tech Stack (Unchanged)

- TanStack Start + Router (file-based routing, SSR)
- TanStack React Table, React Query, React Form
- Tailwind CSS v4 (CSS custom properties, no config file)
- Airtable REST API (existing server functions)
- Cognito auth (existing)
- Node.js serve.js + Docker deployment
