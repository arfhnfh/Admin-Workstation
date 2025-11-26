import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand.sand/80 text-text-muted">
        Loading portal…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return children
}


