# Client Portal Modernization — Phase 1 Design

**Date**: 2026-02-18
**Status**: Approved
**Approach**: Custom App Shell Theme (Approach A) — new Builder elements within existing architecture

## Problem

The published client portals feel like disconnected pages rather than a cohesive app. They lack persistent navigation, a unified header, and the ability to embed external content (MS Outlook Calendar, MS Bookings). The visual aesthetic needs modernization toward a clean, minimal look (Linear/Notion/Vercel style).

## Requirements

- **Aesthetic**: Clean & minimal — whitespace, subtle borders, typography-first, no heavy shadows
- **Priority #1**: Navigation + app shell (sidebar, header, breadcrumbs)
- **Priority #2**: Embed element for iframe content (MS Calendar/Bookings sharing URLs)
- **Portal size**: 3-5 pages typically
- **Embeds**: iframe-only (no API integration)

## Architecture

3 new Builder elements + 1 theme preset, following Baserow's existing element patterns:

| Element | Purpose | Category | Page Place |
|---|---|---|---|
| `SidebarNavigationElement` | Persistent sidebar with page links, branding | `layoutElement` | `PAGE_PLACES.SIDEBAR` |
| `AppHeaderElement` | Top bar with breadcrumbs, page title, user avatar | `layoutElement` | `PAGE_PLACES.HEADER` |
| `IframeElement` | Embed external URLs in portal pages | `baseElement` | `PAGE_PLACES.CONTENT` |

### File Structure

```
web-frontend/modules/builder/
├── components/elements/components/
│   ├── SidebarNavigationElement.vue
│   ├── AppHeaderElement.vue
│   ├── IframeElement.vue
│   └── forms/general/
│       ├── SidebarNavigationElementForm.vue
│       ├── AppHeaderElementForm.vue
│       └── IframeElementForm.vue
├── elementTypes.js  (add 3 new types)
├── plugin.js        (register 3 new types)

backend/src/baserow/contrib/builder/elements/
├── models.py        (add 3 new model classes)
├── element_types.py (add 3 new backend types)
```

## Element Designs

### SidebarNavigationElement

**Visual**: Fixed left sidebar, 260px wide, collapses to icon-only (64px) on tablet, hidden on mobile with hamburger toggle. White/dark background, subtle right border (1px neutral-200). Active page gets highlight background (themed-alpha primary 8%) and left accent border (3px TCR orange). Nav items: 40px row height, 14px font, optional icon + label. Bottom section: user avatar + name + logout.

**Data model**:
```python
class SidebarNavigationElement(Element):
    logo_image = models.ForeignKey(UserFile, null=True)
    title = FormulaField()
    show_user_info = models.BooleanField(default=True)
    collapsed_by_default = models.BooleanField(default=False)
    nav_items = models.JSONField(default=list)
    # Each item: { page_id, label, icon, visibility }
    # Empty list = auto-generate from all pages
```

**Behavior**:
- Empty `nav_items` = auto-generate from all portal pages in order
- Populated `nav_items` = custom list with reordering, hiding, custom labels
- Active page detection via current route
- Respects page-level visibility/role settings
- `getPagePlace()` returns `PAGE_PLACES.SIDEBAR`

**Form**: Logo upload, title formula input, auto-generate vs. manual toggle, sortable item list, show user info toggle, collapsed default toggle, style overrides (background, text color, active highlight, width).

### AppHeaderElement

**Visual**: Full-width sticky header, 56px height, subtle bottom border. Left: breadcrumbs (13px muted) + page title (16px semibold). Right: user avatar (32px) with dropdown. Mobile: hamburger left, title center, avatar right.

**Data model**:
```python
class AppHeaderElement(Element):
    show_breadcrumbs = models.BooleanField(default=True)
    show_page_title = models.BooleanField(default=True)
    show_user_avatar = models.BooleanField(default=True)
    title_override = FormulaField(null=True)
```

**Behavior**:
- Breadcrumbs auto-generated from page hierarchy
- Page title from current page name unless overridden
- User avatar only shown when authentication enabled
- `getPagePlace()` returns `PAGE_PLACES.HEADER`
- Communicates with sidebar via lightweight Vuex module for mobile hamburger toggle

**Form**: Toggles for breadcrumbs, page title, user avatar. Optional title override formula input. Style overrides.

### IframeElement

**Visual**: Clean container, optional 8px border radius, 1px neutral-200 border. Responsive width, configurable height (default 600px). Skeleton loading state, friendly error state.

**Data model**:
```python
class IframeElement(Element):
    url = FormulaField()
    height = models.PositiveIntegerField(default=600)
    allow_fullscreen = models.BooleanField(default=False)
    lazy_load = models.BooleanField(default=True)
```

**Behavior**:
- URL is formula-enabled (static or data-driven)
- `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"` for security
- `loading="lazy"` by default
- In editing mode: placeholder preview with URL displayed (not live iframe)
- Validates `https://` only — blocks `http://`, `javascript:`, `data:` schemes
- No `allow-top-navigation` — prevents redirect attacks

**Form**: URL formula input with helper text, height input, fullscreen toggle, lazy load toggle, style overrides.

## Page Layout Integration

### Layout Assembly in `publicPage.vue`

Elements are partitioned by `getPagePlace()` into sidebar, header, and content groups. If sidebar or header elements exist, content wraps in a CSS Grid layout:

```
┌──────────────────────────────────────────────┐
│ AppHeaderElement (HEADER)                     │
├────────────┬─────────────────────────────────┤
│  Sidebar   │  Content Area (CONTENT)         │
│  Nav       │  Regular elements render here   │
│  (SIDEBAR) │  Including IframeElement        │
└────────────┴─────────────────────────────────┘
```

Grid: `grid-template-columns: auto 1fr`, `grid-template-rows: auto 1fr`.

If no sidebar/header elements exist, rendering is unchanged (zero breaking changes).

### New PAGE_PLACES Constant

```javascript
PAGE_PLACES.SIDEBAR  // new — left sidebar zone
// Existing: CONTENT, HEADER, FOOTER
```

### Responsive Breakpoints

- `>1024px`: Full sidebar (260px) + header + content
- `768-1024px`: Collapsed sidebar (icon-only 64px) + header + content
- `<768px`: Sidebar hidden (hamburger toggle), header simplified

## "Modern Portal" Theme Preset

Selectable theme in Builder settings (not forced on existing portals):

- **Typography**: Inter/system font stack, 14px base, 1.5 line height
- **Colors**: neutral-50 light / neutral-900 dark backgrounds, TCR orange accent only (active states, links)
- **Spacing**: 24px content padding, 16px element gaps
- **Borders**: 1px neutral-200, 8px radius on cards
- **Shadows**: none (border-only separation)

## Phasing

### Phase 1 (this design)
- SidebarNavigationElement
- AppHeaderElement
- IframeElement
- PAGE_PLACES.SIDEBAR + publicPage.vue layout wrapper
- "Modern Portal" theme preset
- Backend models + migrations
- SCSS for all 3 elements + responsive layout

### Future Phases (out of scope)
- Dashboard widgets / KPI cards / charts
- Notification/activity feed elements
- File/document management elements
- Global layout sharing across pages
- MS Graph API integration

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `PAGE_PLACES.SIDEBAR` breaks upstream assumptions | Verify no code assumes only CONTENT/HEADER/FOOTER; add defensively |
| CSS Grid wrapper breaks existing portals | Conditional wrapping — only applied when sidebar/header elements exist |
| Backend migrations | 3 new tables, no data migration needed — standard Django migration |
