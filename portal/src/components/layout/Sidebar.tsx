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
