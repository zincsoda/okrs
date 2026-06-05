import type { AdminUserRecord, AuthUser, UserRole } from '../types/auth'

const fetchOptions: RequestInit = {
  credentials: 'include',
}

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', fetchOptions)
  if (!response.ok) {
    throw new Error(`Failed to check session (${response.status})`)
  }

  const body = (await response.json()) as { user: AuthUser | null }
  return body.user
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    ...fetchOptions,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Login failed'))
  }

  const body = (await response.json()) as { user: AuthUser }
  return body.user
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    ...fetchOptions,
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Logout failed'))
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetch('/api/auth/change-password', {
    ...fetchOptions,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Failed to change password'))
  }
}

export async function fetchUsers(): Promise<AdminUserRecord[]> {
  const response = await fetch('/api/admin/users', fetchOptions)
  if (!response.ok) {
    throw new Error(await parseError(response, 'Failed to load users'))
  }

  const body = (await response.json()) as { users: AdminUserRecord[] }
  return body.users
}

export async function createUser(input: {
  email: string
  password: string
  role: UserRole
  displayName?: string
}): Promise<AdminUserRecord> {
  const response = await fetch('/api/admin/users', {
    ...fetchOptions,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Failed to create user'))
  }

  const body = (await response.json()) as { user: AdminUserRecord }
  return body.user
}

export async function updateUser(
  userId: string,
  input: {
    email?: string
    password?: string
    role?: UserRole
    displayName?: string | null
    active?: boolean
  },
): Promise<AdminUserRecord> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    ...fetchOptions,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Failed to update user'))
  }

  const body = (await response.json()) as { user: AdminUserRecord }
  return body.user
}

export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    ...fetchOptions,
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await parseError(response, 'Failed to delete user'))
  }
}
