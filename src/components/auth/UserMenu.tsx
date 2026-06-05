import { useEffect, useRef, useState } from 'react'
import type { AuthUser } from '../../types/auth'
import { useAuthStore } from '../../store/authStore'
import { ChangePasswordModal } from './ChangePasswordModal'

function getInitials(user: AuthUser): string {
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  return user.email.slice(0, 2).toUpperCase()
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!user) return null

  const displayName = user.displayName ?? user.email

  const handleChangePassword = () => {
    setOpen(false)
    setShowChangePassword(true)
  }

  const handleSignOut = () => {
    setOpen(false)
    void logout()
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Account menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
        >
          {getInitials(user)}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-100"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
              {user.displayName && (
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              )}
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={handleChangePassword}
              className="flex w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Change password
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </>
  )
}
