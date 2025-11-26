import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuthContext } from '@/hooks/useAuthContext'

export function PortalLayout() {
  const { user, logout } = useAuthContext()

  return (
    <div className="flex min-h-screen bg-brand.sand/50 text-charcoal">
      <Sidebar />
      <main className="flex w-full flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-card-border bg-white/70 px-6 py-4 text-sm">
          {user && (
            <div className="text-right">
              <p className="font-semibold">{user.email}</p>
              <p className="text-xs text-text-muted">Signed in</p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-2xl border border-brand.violet/40 px-4 py-2 text-xs font-semibold text-brand.violet"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </header>
        <div className="flex-1 overflow-y-auto bg-brand.sand/40 px-4 py-6 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

