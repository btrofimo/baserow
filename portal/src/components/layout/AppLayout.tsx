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
