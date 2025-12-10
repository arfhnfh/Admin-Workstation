import { useEffect, useState } from 'react'
import {
  BookOpen,
  Home,
  LayoutGrid,
  Settings,
  UserRound,
  Users,
  Plane,
  Car,
  Calendar,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuthContext'
import { isUserAdmin } from '@/services/staffService'

export function Sidebar() {
  const { user } = useAuthContext()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkAdmin = async () => {
      if (!user) {
        if (isMounted) setIsAdmin(false)
        return
      }

      try {
        const admin = await isUserAdmin(user.id)
        if (isMounted) setIsAdmin(admin)
      } catch {
        if (isMounted) setIsAdmin(false)
      }
    }

    checkAdmin()

    return () => {
      isMounted = false
    }
  }, [user])

  // Common navigation items (available to all)
  const commonItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Modules', icon: LayoutGrid, path: '/modules' },
    { label: 'Staff System', icon: UserRound, path: '/staff' },
  ]

  // Staff view module items (available to all staff)
  const staffItems = [
    { label: 'Travel Request', icon: Plane, path: '/travel-request' },
    { label: 'Vehicle Request', icon: Car, path: '/vehicle-request' },
    { label: 'Room Booking', icon: Calendar, path: '/room-booking' },
    { label: 'Library', icon: BookOpen, path: '/library' },
  ]

  // Admin view module items (admin only)
  const adminItems = [
    { label: 'Travel Approvals', icon: Plane, path: '/admin/travel-requests' },
    { label: 'Vehicle Approvals', icon: Car, path: '/admin/vehicle-requests' },
    { label: 'Manage Cars', icon: Car, path: '/admin/cars' },
    { label: 'Manage Staff', icon: Users, path: '/admin/staff' },
    { label: 'Manage Library', icon: BookOpen, path: '/library/manage' },
    { label: 'Manage Room Booking', icon: Calendar, path: '/admin/room-booking' },
  ]

  const renderNavItem = (item: { label: string; icon: any; path: string }) => (
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
  )

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

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {/* Common Items */}
        <div className="space-y-1">
          {commonItems.map(renderNavItem)}
        </div>

        {/* Staff View Module */}
        <div className="space-y-1">
          <div className="px-3 py-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Staff View</p>
          </div>
          {staffItems.map(renderNavItem)}
        </div>

        {/* Admin View Module */}
        {isAdmin && (
          <div className="space-y-1">
            <div className="px-3 py-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Admin View</p>
            </div>
            {adminItems.map(renderNavItem)}
          </div>
        )}

        {/* Settings */}
        <div className="mt-auto space-y-1 border-t border-card-border pt-4">
          {renderNavItem({ label: 'Settings', icon: Settings, path: '/settings' })}
        </div>
      </nav>
    </aside>
  )
}
