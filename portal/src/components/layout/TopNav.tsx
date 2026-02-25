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
