/**
 * Sidebar navigation component for the PrismaFlow dashboard.
 * Collapsible on mobile, persistent on desktop.
 */
'use client'

import {
  Activity,
  ArrowLeftRight,
  ClipboardList,
  Database,
  FlaskConical,
  GitBranch,
  History,
  LayoutDashboard,
  Settings,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'

const nav = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Migrations', href: '/migrations', icon: Database },
  { label: 'Drift', href: '/drift', icon: Activity },
  { label: 'Diff', href: '/diff', icon: ArrowLeftRight },
  { label: 'Simulate', href: '/simulate', icon: FlaskConical },
  { label: 'Repair', href: '/repair', icon: Wrench },
  { label: 'Compare', href: '/compare', icon: GitBranch },
  { label: 'History', href: '/history', icon: History },
  { label: 'Audit', href: '/audit', icon: ClipboardList },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="text-lg font-bold tracking-tight text-foreground">
          Prisma<span className="text-primary">Flow</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          PrismaFlow v{process.env.npm_package_version ?? '0.1.0'}
        </p>
      </div>
    </aside>
  )
}
