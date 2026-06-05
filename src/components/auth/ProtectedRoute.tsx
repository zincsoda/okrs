import { Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '../../types/auth'
import { useAuthStore } from '../../store/authStore'

type ProtectedRouteProps = {
  minRole?: UserRole
  children: React.ReactNode
}

export function ProtectedRoute({ minRole = 'viewer', children }: ProtectedRouteProps) {
  const location = useLocation()
  const status = useAuthStore((s) => s.status)
  const canAccess = useAuthStore((s) => s.canAccess(minRole))

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Checking session…</p>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-slate-900">Access denied</p>
          <p className="mt-2 text-sm text-slate-500">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return children
}
