# Portal Figma Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the client portal to match the TCR UI Kit Figma — dark theme, sidebar navigation, dashboard, and enhanced project views.

**Architecture:** Big-bang redesign. Build design system tokens and shared layout components first, then re-skin every screen. Auth pages use a separate split-panel layout; all other pages share a sidebar+topnav shell. Existing server functions and Airtable data layer are unchanged.

**Tech Stack:** React 19, TanStack Start/Router/Table/Query/Form, Tailwind CSS v4 (CSS custom properties), lucide-react icons, Vitest.

**Design doc:** `docs/plans/2026-02-24-portal-figma-redesign-design.md`

---

## Task 1: Design System — CSS Tokens and Base Styles

**Files:**
- Modify: `portal/src/styles.css`

**Step 1: Add dark theme CSS custom properties and base styles**

Replace the contents of `portal/src/styles.css` with:

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-bg-primary: #141414;
  --color-bg-secondary: #1e1e1e;
  --color-bg-tertiary: #2a2a2a;
  --color-bg-elevated: #333333;

  /* Borders */
  --color-border-default: #333333;
  --color-border-subtle: #2a2a2a;
  --color-border-focus: #dc4b1a;

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #666666;

  /* Accent */
  --color-accent-orange: #dc4b1a;
  --color-accent-orange-hover: #c54318;
  --color-accent-gold: #c5962a;

  /* Status */
  --color-status-new-bg: #dbeafe;
  --color-status-new-text: #1e40af;
  --color-status-submitted-bg: #dcfce7;
  --color-status-submitted-text: #166534;
  --color-status-progress-bg: #c5962a;
  --color-status-progress-text: #000000;
  --color-status-rfi-bg: #fecaca;
  --color-status-rfi-text: #991b1b;
  --color-status-completed-bg: #f3f4f6;
  --color-status-completed-text: #374151;
  --color-status-archived-bg: #374151;
  --color-status-archived-text: #d1d5db;
  --color-status-pending-bg: #fef3c7;
  --color-status-pending-text: #92400e;
  --color-status-revision-bg: #fce7f3;
  --color-status-revision-text: #9d174d;
  --color-status-withdrawn-bg: #f3f4f6;
  --color-status-withdrawn-text: #6b7280;
  --color-status-accepted-bg: #d1fae5;
  --color-status-accepted-text: #065f46;
  --color-status-inspected-bg: #e0e7ff;
  --color-status-inspected-text: #3730a3;
  --color-status-report-bg: #f3e8ff;
  --color-status-report-text: #6b21a8;
  --color-status-estimate-bg: #fff7ed;
  --color-status-estimate-text: #9a3412;
  --color-status-document-bg: #f0fdf4;
  --color-status-document-text: #166534;

  /* Sidebar */
  --sidebar-width: 15rem;
  --sidebar-collapsed-width: 4rem;
  --topnav-height: 3.5rem;
}

body {
  @apply m-0 bg-bg-primary text-text-primary;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar styling for dark theme */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--color-bg-primary);
}
::-webkit-scrollbar-thumb {
  background: var(--color-bg-elevated);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
```

**Step 2: Verify build succeeds**

Run: `cd portal && npm run build`
Expected: Build completes without CSS errors. Tailwind v4 `@theme` directive registers custom colors.

**Step 3: Commit**

```bash
git add portal/src/styles.css
git commit -m "feat(portal): add dark theme design tokens via Tailwind v4 @theme"
```

---

## Task 2: Shared UI Components — Button, Input, Card, Tabs, Badge

**Files:**
- Create: `portal/src/components/ui/Button.tsx`
- Create: `portal/src/components/ui/Input.tsx`
- Create: `portal/src/components/ui/Card.tsx`
- Create: `portal/src/components/ui/Tabs.tsx`
- Create: `portal/src/components/ui/Select.tsx`
- Modify: `portal/src/components/StatusBadge.tsx`
- Modify: `portal/src/components/PriorityBadge.tsx`
- Create: `portal/src/components/RequestTypeTags.tsx`

**Step 1: Create Button component**

```tsx
// portal/src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-orange text-white hover:bg-accent-orange-hover disabled:opacity-50',
  secondary:
    'border border-border-default text-text-primary hover:bg-bg-tertiary disabled:opacity-50',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-50',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

**Step 2: Create Input component**

```tsx
// portal/src/components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-lg border border-border-default bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:ring-2 focus:ring-accent-orange/20 focus:outline-none ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

**Step 3: Create Card component**

```tsx
// portal/src/components/ui/Card.tsx
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
}

export function Card({
  padding = true,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border-default bg-bg-secondary ${padding ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
```

**Step 4: Create Tabs component**

```tsx
// portal/src/components/ui/Tabs.tsx
interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border-default">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-accent-orange text-accent-orange'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {tab.label}
          {tab.count != null && (
            <span className="ml-1.5 rounded-full bg-bg-tertiary px-1.5 py-0.5 text-xs">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
```

**Step 5: Create Select component**

```tsx
// portal/src/components/ui/Select.tsx
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchable?: boolean
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchable = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = searchable
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-lg border bg-bg-tertiary px-4 py-2.5 text-sm text-left transition-colors ${
          isOpen
            ? 'border-border-focus ring-2 ring-accent-orange/20'
            : 'border-border-default'
        }`}
      >
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-default bg-white shadow-lg">
          {searchable && (
            <div className="p-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:outline-none"
                placeholder="Search..."
              />
            </div>
          )}
          <div className="max-h-60 overflow-auto py-1">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                  setSearch('')
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
              >
                {option.label}
                {option.value === value && (
                  <Check size={16} className="text-accent-orange" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 6: Update StatusBadge with Figma status colors**

Replace `portal/src/components/StatusBadge.tsx`:

```tsx
const STATUS_STYLES: Record<string, string> = {
  'New Project': 'bg-status-new-bg text-status-new-text',
  'New Request': 'bg-status-new-bg text-status-new-text',
  Submitted: 'bg-status-submitted-bg text-status-submitted-text',
  'In-Progress': 'bg-status-progress-bg text-status-progress-text',
  'In Review': 'bg-status-pending-bg text-status-pending-text',
  RFI: 'bg-status-rfi-bg text-status-rfi-text',
  Completed: 'bg-status-completed-bg text-status-completed-text',
  Accepted: 'bg-status-accepted-bg text-status-accepted-text',
  Archived: 'bg-status-archived-bg text-status-archived-text',
  'Pending Inspection': 'bg-status-pending-bg text-status-pending-text',
  Inspected: 'bg-status-inspected-bg text-status-inspected-text',
  'Report Generation': 'bg-status-report-bg text-status-report-text',
  'Estimate Generation': 'bg-status-estimate-bg text-status-estimate-text',
  'Document Generation': 'bg-status-document-bg text-status-document-text',
  'In Revision': 'bg-status-revision-bg text-status-revision-text',
  Withdrawn: 'bg-status-withdrawn-bg text-status-withdrawn-text',
  Approved: 'bg-status-submitted-bg text-status-submitted-text',
  Rejected: 'bg-status-rfi-bg text-status-rfi-text',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-bg-tertiary text-text-secondary'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  )
}
```

**Step 7: Update PriorityBadge with Figma icons**

Replace `portal/src/components/PriorityBadge.tsx`:

```tsx
import { Circle, AlertCircle, AlertTriangle } from 'lucide-react'

const PRIORITY_CONFIG: Record<
  string,
  { icon: typeof Circle; style: string; iconColor: string }
> = {
  Normal: {
    icon: Circle,
    style: 'border border-border-default text-text-secondary',
    iconColor: 'text-text-muted',
  },
  Low: {
    icon: Circle,
    style: 'border border-border-default text-text-secondary',
    iconColor: 'text-text-muted',
  },
  Medium: {
    icon: AlertCircle,
    style: 'border border-orange-400 text-orange-400',
    iconColor: 'text-orange-400',
  },
  High: {
    icon: AlertTriangle,
    style: 'bg-red-500/10 border border-red-500 text-red-400',
    iconColor: 'text-red-400',
  },
}

interface PriorityBadgeProps {
  priority: string
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG['Normal']
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.style}`}
    >
      <Icon size={12} className={config.iconColor} />
      {priority}
    </span>
  )
}
```

**Step 8: Create RequestTypeTags component**

```tsx
// portal/src/components/RequestTypeTags.tsx
const TAG_STYLES: Record<string, string> = {
  'Engineering Report': 'bg-red-500/10 text-red-400 border-red-500/30',
  Estimate: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  'Weather Analysis': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Roof Report': 'bg-red-500/10 text-red-400 border-red-500/30',
  'Photo Report': 'bg-green-500/10 text-green-400 border-green-500/30',
  'Thermal Mapping': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  'Moisture Mapping': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Bid: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  'General Document': 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  Survey: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  Inspection: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Measurements: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  Research: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
}

interface RequestTypeTagsProps {
  types: string[]
}

export function RequestTypeTags({ types }: RequestTypeTagsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((type) => {
        const style =
          TAG_STYLES[type] ?? 'bg-gray-500/10 text-gray-300 border-gray-500/30'
        return (
          <span
            key={type}
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}
          >
            {type}
          </span>
        )
      })}
    </div>
  )
}
```

**Step 9: Verify build**

Run: `cd portal && npm run build`
Expected: No errors.

**Step 10: Commit**

```bash
git add portal/src/components/ui/ portal/src/components/StatusBadge.tsx portal/src/components/PriorityBadge.tsx portal/src/components/RequestTypeTags.tsx
git commit -m "feat(portal): add dark theme UI components — Button, Input, Card, Tabs, Select, updated badges"
```

---

## Task 3: Layout Shell — Sidebar, TopNav, AppLayout

**Files:**
- Create: `portal/src/components/layout/Sidebar.tsx`
- Create: `portal/src/components/layout/TopNav.tsx`
- Create: `portal/src/components/layout/AppLayout.tsx`
- Create: `portal/src/components/layout/TCRLogo.tsx`
- Modify: `portal/src/routes/__root.tsx`

**Step 1: Create TCR Logo component**

```tsx
// portal/src/components/layout/TCRLogo.tsx
interface TCRLogoProps {
  collapsed?: boolean
}

export function TCRLogo({ collapsed = false }: TCRLogoProps) {
  if (collapsed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-orange">
        <span className="text-lg font-bold text-white">T</span>
      </div>
    )
  }

  return (
    <svg viewBox="0 0 80 32" className="h-8" fill="none">
      <text
        x="0"
        y="26"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize="28"
        fill="#dc4b1a"
      >
        TCR
      </text>
    </svg>
  )
}
```

**Step 2: Create Sidebar component**

```tsx
// portal/src/components/layout/Sidebar.tsx
import { Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import {
  BarChart3,
  FolderOpen,
  FilePlus,
  ChevronDown,
  ChevronRight,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Search,
} from 'lucide-react'
import { TCRLogo } from './TCRLogo'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  projectYears?: string[]
}

export function Sidebar({ collapsed, onToggle, projectYears = [] }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const [projectsOpen, setProjectsOpen] = useState(true)

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border-default bg-bg-secondary transition-[width] duration-200 ${
        collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      }`}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-[var(--topnav-height)] items-center justify-between border-b border-border-default px-3">
        <Link to="/" className="flex items-center gap-2">
          <TCRLogo collapsed={collapsed} />
        </Link>
        <button
          onClick={onToggle}
          className="rounded-md p-1 text-text-muted hover:bg-bg-tertiary hover:text-text-secondary"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-tertiary px-3 py-2 text-sm text-text-muted">
            <Search size={14} />
            <span>Search</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {/* Dashboard */}
        <Link
          to="/"
          className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            location.pathname === '/'
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <BarChart3 size={18} />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Projects */}
        <div className="mt-2">
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive('/projects')
                ? 'bg-bg-tertiary text-text-primary'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            <FolderOpen size={18} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Projects</span>
                {projectsOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </>
            )}
          </button>
          {!collapsed && projectsOpen && (
            <div className="ml-6 space-y-0.5">
              {projectYears.map((year) => (
                <Link
                  key={year}
                  to="/projects"
                  search={{ year }}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-bg-tertiary hover:text-text-secondary"
                >
                  <FolderOpen size={14} />
                  {year}
                </Link>
              ))}
              {projectYears.length === 0 && (
                <Link
                  to="/projects"
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-bg-tertiary hover:text-text-secondary"
                >
                  All Projects
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Submit New */}
        <Link
          to="/projects/submit"
          className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive('/projects/submit')
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <FilePlus size={18} />
          {!collapsed && <span>Submit New</span>}
        </Link>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-default px-2 py-2">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-bg-tertiary hover:text-text-secondary"
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </Link>
        {!collapsed && user && (
          <div className="mt-2 rounded-lg bg-bg-tertiary px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-orange text-xs font-bold text-white">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-xs text-text-secondary">
                {user.email}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
```

**Step 3: Create TopNav component**

```tsx
// portal/src/components/layout/TopNav.tsx
import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface TopNavProps {
  sidebarCollapsed: boolean
  onMenuClick: () => void
}

export function TopNav({ sidebarCollapsed, onMenuClick }: TopNavProps) {
  const { user, logout } = useAuth()

  return (
    <header
      className={`fixed top-0 z-30 flex h-[var(--topnav-height)] items-center justify-between border-b border-border-default bg-bg-secondary px-4 transition-[left] duration-200 ${
        sidebarCollapsed
          ? 'left-[var(--sidebar-collapsed-width)]'
          : 'left-[var(--sidebar-width)]'
      } right-0`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1 text-text-muted hover:bg-bg-tertiary hover:text-text-secondary lg:hidden"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-text-secondary">{user.email}</span>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  )
}
```

**Step 4: Create AppLayout wrapper**

```tsx
// portal/src/components/layout/AppLayout.tsx
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'

interface AppLayoutProps {
  children: React.ReactNode
  projectYears?: string[]
}

export function AppLayout({ children, projectYears }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        projectYears={projectYears}
      />
      <TopNav
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className={`pt-[var(--topnav-height)] transition-[margin-left] duration-200 ${
          sidebarCollapsed
            ? 'ml-[var(--sidebar-collapsed-width)]'
            : 'ml-[var(--sidebar-width)]'
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
```

**Step 5: Update __root.tsx to use AppLayout for authenticated routes**

Modify the `RootDocument` function in `portal/src/routes/__root.tsx`. The key change: wrap `{children}` in the auth context but do NOT add AppLayout here — each route will opt-in to the layout (auth routes use their own split layout, app routes use AppLayout). The body background should be dark:

The existing `__root.tsx` already sets body styles via `styles.css`, so no change is needed here beyond ensuring the body class applies. The individual route files will import and use `AppLayout`.

**Step 6: Verify build**

Run: `cd portal && npm run build`
Expected: No errors.

**Step 7: Commit**

```bash
git add portal/src/components/layout/
git commit -m "feat(portal): add layout shell — Sidebar, TopNav, AppLayout with dark theme"
```

---

## Task 4: Auth Pages — Login (Split Layout with Aerial Photos)

**Files:**
- Create: `portal/src/components/layout/AuthLayout.tsx`
- Create: `portal/public/aerials/` (directory for stock photos)
- Modify: `portal/src/routes/auth/login.tsx`

**Step 1: Create AuthLayout split component**

```tsx
// portal/src/components/layout/AuthLayout.tsx
import { TCRLogo } from './TCRLogo'

const AERIAL_IMAGES = [
  '/aerials/aerial-1.jpg',
  '/aerials/aerial-2.jpg',
  '/aerials/aerial-3.jpg',
]

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const randomImage =
    AERIAL_IMAGES[Math.floor(Math.random() * AERIAL_IMAGES.length)]

  return (
    <div className="flex min-h-screen">
      {/* Left panel — form */}
      <div className="flex w-full flex-col justify-between bg-bg-secondary px-8 py-10 lg:w-[45%]">
        <div>
          <TCRLogo />
        </div>
        <div className="mx-auto w-full max-w-sm">{children}</div>
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} TCR CG, PLLC
        </p>
      </div>

      {/* Right panel — aerial photo */}
      <div
        className="hidden bg-cover bg-center lg:block lg:w-[55%]"
        style={{ backgroundImage: `url(${randomImage})` }}
      />
    </div>
  )
}
```

**Step 2: Download/create placeholder aerial images**

Place 3 stock aerial/satellite photos in `portal/public/aerials/`. For now, create simple dark placeholder images so the layout works. These will be replaced with real stock photos.

Create the directory and placeholder files:

```bash
mkdir -p portal/public/aerials
```

Create a placeholder SVG for each (to be replaced with real JPGs later):

```bash
# Create 3 placeholder SVGs that look like dark aerial views
for i in 1 2 3; do
  cat > portal/public/aerials/aerial-${i}.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect fill="#1a2332" width="1200" height="800"/>
  <rect fill="#1e2a3a" x="100" y="100" width="400" height="250" rx="4"/>
  <rect fill="#2a3a4a" x="550" y="50" width="300" height="200" rx="4"/>
  <rect fill="#1e2a3a" x="200" y="400" width="350" height="180" rx="4"/>
  <rect fill="#2a3a4a" x="600" y="350" width="450" height="300" rx="4"/>
  <rect fill="#354555" x="50" y="650" width="500" height="100" rx="4"/>
</svg>
SVGEOF
done
```

Update the `AERIAL_IMAGES` array to use `.svg` extensions temporarily (will be swapped to `.jpg` when real photos are added).

**Step 3: Rewrite login.tsx with Figma design**

Replace `portal/src/routes/auth/login.tsx` with the dark split layout. Key changes:
- Wrap in `AuthLayout` instead of centered card
- Dark inputs (using `Input` component)
- Orange "Sign in" button (using `Button` component)
- "Remember for 30 days" checkbox
- "Forgot password" link inline with password label
- Large "Log in" heading
- Keep existing `handleLogin` and `handleChangePassword` logic

The full component retains all current auth logic (login, NEW_PASSWORD_REQUIRED challenge) but wraps it in `AuthLayout` and uses the new dark-theme UI components.

**Step 4: Rewrite forgot-password.tsx with Figma multi-step design**

Replace `portal/src/routes/auth/forgot-password.tsx` with:
- `AuthLayout` wrapper
- 4-step flow with step indicator dots
- Step 1: key icon, "Forgot password?", email input, "Reset password" button
- Step 2: envelope icon, "Check your email", destination text, "Back to log in"
- Step 3: lock icon, "Set new password", password + confirm, requirement checklist
- Step 4: checkmark icon, "Password reset", "Continue" button

Keep existing `requestPasswordReset` and `confirmPasswordReset` server function calls.

**Step 5: Verify build**

Run: `cd portal && npm run build`
Expected: No errors. Auth routes use AuthLayout, not AppLayout.

**Step 6: Commit**

```bash
git add portal/src/components/layout/AuthLayout.tsx portal/public/aerials/ portal/src/routes/auth/login.tsx portal/src/routes/auth/forgot-password.tsx
git commit -m "feat(portal): redesign auth pages with dark split layout and aerial backgrounds"
```

---

## Task 5: Dashboard Home Page

**Files:**
- Create: `portal/src/routes/dashboard.tsx` (or modify `portal/src/routes/index.tsx`)
- Modify: `portal/src/routes/index.tsx`

**Step 1: Rewrite index.tsx as authenticated dashboard**

Replace the landing page with a dashboard that redirects to `/auth/login` if not authenticated. For authenticated users, show:
- `AppLayout` wrapper
- Welcome banner: "Hey, Welcome [email]."
- Dashboard cards grid:
  - Active Projects card with count + "Go to Projects" link
  - Submit New Project card with CTA
  - Documents card (Coming Soon)
  - Resources card (Coming Soon)
- Use `Card` component for each
- Use `listProjects` server function to get project count

**Step 2: Update routes to use AppLayout**

In `portal/src/routes/index.tsx` (dashboard), wrap content in `<AppLayout>`.

**Step 3: Verify build**

Run: `cd portal && npm run build`

**Step 4: Commit**

```bash
git add portal/src/routes/index.tsx
git commit -m "feat(portal): add dark dashboard home page with project count cards"
```

---

## Task 6: Projects List — Dark Table with Tabs and Enhanced Badges

**Files:**
- Modify: `portal/src/routes/projects/index.tsx`
- Modify: `portal/src/components/ProjectsTable.tsx`

**Step 1: Update ProjectsTable with dark theme**

Restyle the table:
- Dark header (`bg-bg-tertiary`, uppercase `text-text-muted` labels)
- Dark rows (`bg-bg-secondary`, `hover:bg-bg-tertiary`)
- Dark dividers (`divide-border-default`)
- Request Type column renders `<RequestTypeTags>` instead of comma-separated text
- Pagination controls match dark theme

**Step 2: Update projects/index.tsx with tabs and AppLayout**

- Wrap in `<AppLayout>`
- Add `<Tabs>` component above table: Active | Completed | Archive
- Tab filtering logic:
  - Active: statuses `New Project, New Request, Submitted, In-Progress, RFI, Pending Inspection, Inspected, Report Generation, Estimate Generation, Document Generation, In Revision`
  - Completed: `Completed, Accepted`
  - Archive: `Archived, Withdrawn`
- "+ New Project" orange button in header
- Replace existing skeleton with dark-themed skeleton
- Remove old light-theme styles

**Step 3: Verify build**

Run: `cd portal && npm run build`

**Step 4: Commit**

```bash
git add portal/src/routes/projects/index.tsx portal/src/components/ProjectsTable.tsx
git commit -m "feat(portal): redesign projects list with dark table, tabs, and colored badges"
```

---

## Task 7: Project Detail — Two-Column Grid with Tabs

**Files:**
- Modify: `portal/src/routes/projects/$projectId.tsx`
- Modify: `portal/src/components/CommentThread.tsx`
- Modify: `portal/src/components/StatusTimeline.tsx` (remove or replace)

**Step 1: Rewrite $projectId.tsx with Figma layout**

- `<AppLayout>` wrapper
- "< BACK TO PROJECTS" link (orange)
- Header: file number with icon + status badge + priority badge
- Project photo area (right side, placeholder if no Airtable attachment)
- `<Tabs>`: Project Details | Documents | Photos | Activity
- **Project Details tab**: two-column grid displaying all Airtable fields:
  - Status (large gold/colored pill)
  - File No, DOL, Hail Size (3-column row)
  - County, Coordinates (2-column row)
  - Owner Company, Owner POC (2-column row)
  - Company, POC (2-column row)
  - Roof Area, Roofing System (gold pill), Insulation (dark pills), No. RTUs
  - Inspection Notes section (date + text)
  - Fields with no value are hidden
- **Documents tab**: "Coming Soon" empty state
- **Photos tab**: "Coming Soon" empty state
- **Activity tab**: restyled CommentThread

**Step 2: Restyle CommentThread for dark theme**

- Dark card backgrounds
- Author name in orange
- Timestamp in text-muted
- Message body in text-secondary
- Input: dark textarea with orange send button arrow icon
- Attachment icon (disabled, grayed out)

**Step 3: Remove StatusTimeline or restyle**

The Figma shows status as a single badge, not a timeline. Either remove `StatusTimeline.tsx` or keep it as a simple status display. The detail page will show the status as a prominent badge in the header and as a field in the grid.

**Step 4: Verify build**

Run: `cd portal && npm run build`

**Step 5: Commit**

```bash
git add portal/src/routes/projects/\$projectId.tsx portal/src/components/CommentThread.tsx
git commit -m "feat(portal): redesign project detail with two-column grid and tabbed layout"
```

---

## Task 8: Submit Form — Dark Theme with Enhanced Fields

**Files:**
- Modify: `portal/src/routes/projects/submit.tsx`
- Modify: `portal/src/components/AddressAutocomplete.tsx`
- Modify: `portal/src/api/projects.functions.ts` (add new field mappings)

**Step 1: Restyle AddressAutocomplete for dark theme**

- Dark input bg
- Dark dropdown bg (`bg-bg-secondary`)
- Light text on dark
- Orange focus ring
- Keep existing geocoding logic

**Step 2: Update submitProject server function with additional fields**

Add new optional fields to the Zod schema and Airtable mapping:
- `claimNo` (string, optional)
- `dol` (string, optional — date of loss)
- `ownerCompany` (string, optional)
- `owner` (string, optional)
- `access` (string, optional)
- `accessRequested` (string, optional)
- `additionalComments` (string, optional)

These map to Airtable columns: `Claim No`, `DOL`, `Owner Company`, `Owner`, `Access`, `Will Access Be Requested`, `Additional Comments`.

**Step 3: Rewrite submit.tsx with Figma dark form**

- `<AppLayout>` wrapper
- Dark form using `Input`, `Select`, `Button` components
- Address section with autocomplete
- Claim No, DOL (date), file no
- Request Type as checkbox grid (Engineering Report, Estimate, Weather Data, etc.)
- Owner Company, Owner
- Access, Will access be requested
- Additional Comments (dark textarea)
- Priority (custom Select)
- Cancel (ghost button) + Save (primary button)

**Step 4: Verify build**

Run: `cd portal && npm run build`

**Step 5: Commit**

```bash
git add portal/src/routes/projects/submit.tsx portal/src/components/AddressAutocomplete.tsx portal/src/api/projects.functions.ts
git commit -m "feat(portal): redesign submit form with dark theme and enhanced fields"
```

---

## Task 9: Cleanup and Final Verification

**Files:**
- Delete: `portal/src/components/Header.tsx` (replaced by layout shell)
- Delete: `portal/src/components/demo.FormComponents.tsx` (unused)
- Delete: `portal/src/data/demo-table-data.ts` (unused)
- Delete: `portal/src/hooks/demo.form-context.ts` (unused)
- Delete: `portal/src/hooks/demo.form.ts` (unused)
- Modify: `portal/src/routes/auth/callback.tsx` (dark loading spinner)

**Step 1: Remove unused demo/legacy files**

```bash
rm portal/src/components/Header.tsx
rm portal/src/components/demo.FormComponents.tsx
rm portal/src/data/demo-table-data.ts
rm portal/src/hooks/demo.form-context.ts
rm portal/src/hooks/demo.form.ts
```

**Step 2: Update auth/callback.tsx with dark loading spinner**

Replace the loading state with a dark-themed centered spinner.

**Step 3: Full build and test**

Run: `cd portal && npm run build && npm test`
Expected: Build succeeds, tests pass.

**Step 4: Visual smoke test**

Run: `cd portal && npm run dev`
Visit each route and verify dark theme:
- `/auth/login` — split layout, dark form, aerial photo
- `/auth/forgot-password` — multi-step dark flow
- `/` — dashboard with project cards
- `/projects` — dark table with tabs and colored badges
- `/projects/:id` — two-column detail with tabs
- `/projects/submit` — dark form with enhanced fields

**Step 5: Commit**

```bash
git add -A
git commit -m "chore(portal): remove legacy files and finalize dark theme redesign"
```

---

## Task 10: Deploy to Production

**Step 1: Push to remote**

```bash
git push origin develop
```

**Step 2: Deploy to EC2**

Use the established deployment pipeline:
1. SSH/SSM into EC2
2. Git pull latest changes
3. Rebuild Docker image
4. Restart container
5. Verify health checks

**Step 3: Verify production**

- Visit `https://tcrprojects.com/auth/login` — confirm dark split layout
- Log in — confirm dashboard loads
- Navigate projects — confirm dark table with badges
- View project detail — confirm two-column grid
- Submit form — confirm dark form

---

## Summary

| Task | Description | Est. Steps |
|------|------------|-----------|
| 1 | CSS tokens + base styles | 3 |
| 2 | Shared UI components | 10 |
| 3 | Layout shell (Sidebar, TopNav, AppLayout) | 7 |
| 4 | Auth pages (login, forgot password) | 6 |
| 5 | Dashboard home page | 4 |
| 6 | Projects list (dark table, tabs) | 4 |
| 7 | Project detail (two-column grid, tabs) | 5 |
| 8 | Submit form (dark theme, new fields) | 5 |
| 9 | Cleanup + verification | 5 |
| 10 | Deploy to production | 3 |
| **Total** | | **52 steps** |
