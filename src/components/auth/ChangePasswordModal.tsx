import { useState } from 'react'
import * as authApi from '../../api/authApi'
import { Modal } from '../ui/Modal'

type ChangePasswordModalProps = {
  open: boolean
  onClose: () => void
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Change password">
      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Your password has been updated.</p>
          <div className="flex justify-end">
            <button type="button" onClick={handleClose} className="btn-primary btn-sm">
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div>
            <label htmlFor="current-password" className="form-label">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="form-label">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="form-label">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="input-field"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary btn-sm">
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
