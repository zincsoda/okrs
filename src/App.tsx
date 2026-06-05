import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from './components/admin/AdminPage'
import { LoginPage } from './components/auth/LoginPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './components/dashboard/Dashboard'
import { EditPage } from './components/edit/EditPage'
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading OKRs…</p>
      </div>
    )
  }

  if (hydrationStatus === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-slate-900">Could not load OKRs</p>
          <p className="mt-2 text-sm text-slate-500">{hydrationError}</p>
          <button
            type="button"
            onClick={() => void hydrateFromApi()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Checking session…</p>
      </div>
    )
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
