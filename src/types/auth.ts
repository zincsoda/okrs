export type UserRole = 'admin' | 'editor' | 'viewer'

export type AuthUser = {
  id: string
  email: string
  displayName: string | null
  role: UserRole
}

export type AdminUserRecord = AuthUser & {
  active: boolean
  createdAt: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

export const ROLE_RANK: Record<UserRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
}

export function hasMinRole(role: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole]
}
