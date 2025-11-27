import {
  BookOpen,
  Home,
  LayoutGrid,
  MessageSquare,
  Settings,
  UserRound,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Standard Request', icon: MessageSquare, path: '/requests' },
  { label: 'Modules', icon: LayoutGrid, path: '/modules' },
  { label: 'Staff System', icon: UserRound, path: '/staff/hamiduddin' },
  { label: 'Library', icon: BookOpen, path: '/library' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-card-border bg-white/90 p-6 shadow-card lg:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-full bg-brand.violet/10 p-3 text-brand.violet">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-text-muted">Admin</p>
          <p className="text-lg font-semibold text-charcoal">Workstation</p>
        </div>
      </div>

      <button
        type="button"
        className="mb-6 w-full rounded-2xl bg-brand.charcoal py-3 text-sm font-semibold text-white shadow-card transition hover:bg-black"
      >
        Back To Portal
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand.violet/10 text-brand.violet' : 'text-text-muted hover:bg-brand.sand/60'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

