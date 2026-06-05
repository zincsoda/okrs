import { useCallback, useEffect, useState } from 'react'
import * as authApi from '../../api/authApi'
import { useAuthStore } from '../../store/authStore'
import type { AdminUserRecord, UserRole } from '../../types/auth'
import { ROLE_LABELS } from '../../types/auth'
import { Modal } from '../ui/Modal'

const ROLES: UserRole[] = ['viewer', 'editor', 'admin']

type UserFormState = {
  email: string
  displayName: string
  role: UserRole
  password: string
  active: boolean
}

const emptyForm = (): UserFormState => ({
  email: '',
  displayName: '',
  role: 'viewer',
  password: '',
  active: true,
})

export function UserManagement() {
  const currentUser = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nextUsers = await authApi.fetchUsers()
      setUsers(nextUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const openCreateForm = () => {
    setEditingUserId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEditForm = (user: AdminUserRecord) => {
    setEditingUserId(user.id)
    setForm({
      email: user.email,
      displayName: user.displayName ?? '',
      role: user.role,
      password: '',
      active: user.active,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingUserId(null)
    setForm(emptyForm())
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingUserId) {
        await authApi.updateUser(editingUserId, {
          email: form.email,
          displayName: form.displayName || null,
          role: form.role,
          active: form.active,
          ...(form.password ? { password: form.password } : {}),
        })
      } else {
        await authApi.createUser({
          email: form.email,
          password: form.password,
          role: form.role,
          displayName: form.displayName || undefined,
        })
      }

      closeForm()
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user: AdminUserRecord) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return

    setError(null)
    try {
      await authApi.deleteUser(user.id)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Users</h2>
          <p className="mt-1 text-sm text-slate-500">Create and manage sign-in accounts manually.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="btn-accent btn-sm">
          Add user
        </button>
      </div>

      {error && !showForm && (
        <p className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="px-4 py-8 text-sm text-slate-500">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="px-4 py-8 text-sm text-slate-500">No users yet. Add the first account above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 text-slate-900">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.displayName ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{ROLE_LABELS[user.role]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(user)}
                        className="btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(user)}
                          className="btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editingUserId ? 'Edit user' : 'Add user'}
      >
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div>
            <label htmlFor="user-email" className="form-label">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="user-name" className="form-label">
              Display name
            </label>
            <input
              id="user-name"
              type="text"
              value={form.displayName}
              onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="user-role" className="form-label">
              Role
            </label>
            <select
              id="user-role"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
              }
              className="select-field"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="user-password" className="form-label">
              {editingUserId ? 'New password (optional)' : 'Password'}
            </label>
            <input
              id="user-password"
              type="password"
              required={!editingUserId}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="input-field"
            />
          </div>

          {editingUserId && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                className="rounded border-slate-300 text-indigo-600"
              />
              Active account
            </label>
          )}

          {error && showForm && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeForm} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary btn-sm">
              {submitting ? 'Saving…' : editingUserId ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
