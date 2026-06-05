import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LoadingScreen } from '../ui/LoadingScreen'

export function LoginPage() {
  const location = useLocation()
  const status = useAuthStore((s) => s.status)
  const login = useAuthStore((s) => s.login)
  const authError = useAuthStore((s) => s.error)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (status === 'loading') {
    return <LoadingScreen message="Checking session…" />
  }

  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="card w-full max-w-md p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">SRT Tech Team OKRs</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Use the account created by your administrator.</p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field"
            />
          </div>

          {(error ?? authError) && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error ?? authError}</p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
