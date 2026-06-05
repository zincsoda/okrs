import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from './components/admin/AdminPage'
import { LoginPage } from './components/auth/LoginPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './components/dashboard/Dashboard'
import { EditPage } from './components/edit/EditPage'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { useAuthStore } from './store/authStore'
import { useOkrStore } from './store/okrStore'

function AuthenticatedApp() {
  const hydrationStatus = useOkrStore((s) => s.hydrationStatus)
  const hydrationError = useOkrStore((s) => s.hydrationError)
  const hydrateFromApi = useOkrStore((s) => s.hydrateFromApi)

  useEffect(() => {
    void hydrateFromApi()
  }, [hydrateFromApi])

  if (hydrationStatus === 'loading') {
    return <LoadingScreen message="Loading OKRs…" />
  }

  if (hydrationStatus === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card max-w-md p-6 text-center">
          <p className="font-medium text-slate-900">Could not load OKRs</p>
          <p className="mt-2 text-sm text-slate-500">{hydrationError}</p>
          <button
            type="button"
            onClick={() => void hydrateFromApi()}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute minRole="viewer">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit"
        element={
          <ProtectedRoute minRole="editor">
            <EditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute minRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const authStatus = useAuthStore((s) => s.status)
  const checkSession = useAuthStore((s) => s.checkSession)

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  if (authStatus === 'loading') {
    return <LoadingScreen message="Checking session…" />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            authStatus === 'authenticated' ? (
              <AuthenticatedApp />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
