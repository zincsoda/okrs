export type UserRole = 'admin' | 'editor' | 'viewer'

export type AuthUser = {
  id: string
  email: string
  displayName: string | null
  role: UserRole
}

type UserRow = {
  id: string
  email: string
  password_hash: string
  role: UserRole
  display_name: string | null
  active: number
}

const SESSION_COOKIE = 'okr_session'
const SESSION_DAYS = 7
const PBKDF2_ITERATIONS = 100_000

const ROLE_RANK: Record<UserRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
}

export function hasMinRole(role: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole]
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function hashPassword(password: string, salt?: Uint8Array): Promise<string> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return `${bytesToHex(saltBytes)}:${bytesToHex(new Uint8Array(hash))}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':')
  if (!saltHex || !hashHex) return false
  const computed = await hashPassword(password, hexToBytes(saltHex))
  return computed === storedHash
}

export async function createPasswordHash(password: string): Promise<string> {
  return hashPassword(password)
}

function parseSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === SESSION_COOKIE) {
      return rest.join('=')
    }
  }

  return null
}

function sessionExpiryDate(): Date {
  const expires = new Date()
  expires.setDate(expires.getDate() + SESSION_DAYS)
  return expires
}

function buildSessionCookie(sessionId: string, expires: Date, secure: boolean): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60
  const securePart = secure ? '; Secure' : ''
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Expires=${expires.toUTCString()}${securePart}`
}

function clearSessionCookie(secure: boolean): string {
  const securePart = secure ? '; Secure' : ''
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${securePart}`
}

function rowToAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  }
}

export async function getSessionUser(db: D1Database, request: Request): Promise<AuthUser | null> {
  const sessionId = parseSessionCookie(request)
  if (!sessionId) return null

  const now = new Date().toISOString()
  const result = await db
    .prepare(
      `SELECT u.id, u.email, u.password_hash, u.role, u.display_name, u.active
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .bind(sessionId, now)
    .first<UserRow>()

  return result ? rowToAuthUser(result) : null
}

export async function loginUser(
  db: D1Database,
  email: string,
  password: string,
  secureCookie: boolean,
): Promise<{ user: AuthUser; setCookie: string } | { error: string }> {
  const result = await db
    .prepare(
      `SELECT id, email, password_hash, role, display_name, active
       FROM users WHERE email = ? COLLATE NOCASE`,
    )
    .bind(email.trim())
    .first<UserRow>()

  if (!result || result.active !== 1) {
    return { error: 'Invalid email or password' }
  }

  const valid = await verifyPassword(password, result.password_hash)
  if (!valid) {
    return { error: 'Invalid email or password' }
  }

  const sessionId = crypto.randomUUID()
  const expires = sessionExpiryDate()
  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, result.id, expires.toISOString())
    .run()

  return {
    user: rowToAuthUser(result),
    setCookie: buildSessionCookie(sessionId, expires, secureCookie),
  }
}

export async function logoutUser(db: D1Database, request: Request, secureCookie: boolean): Promise<string> {
  const sessionId = parseSessionCookie(request)
  if (sessionId) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  }
  return clearSessionCookie(secureCookie)
}

export async function changeOwnPassword(
  db: D1Database,
  request: Request,
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: true } | { error: string }> {
  if (!currentPassword || !newPassword) {
    return { error: 'Current and new password are required' }
  }

  const result = await db
    .prepare('SELECT password_hash FROM users WHERE id = ? AND active = 1')
    .bind(userId)
    .first<{ password_hash: string }>()

  if (!result) {
    return { error: 'User not found' }
  }

  const valid = await verifyPassword(currentPassword, result.password_hash)
  if (!valid) {
    return { error: 'Current password is incorrect' }
  }

  const passwordHash = await createPasswordHash(newPassword)
  await db
    .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(passwordHash, userId)
    .run()

  const sessionId = parseSessionCookie(request)
  if (sessionId) {
    await db
      .prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?')
      .bind(userId, sessionId)
      .run()
  } else {
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run()
  }

  return { success: true }
}

export type AdminUserRecord = AuthUser & {
  active: boolean
  createdAt: string
}

export async function listUsers(db: D1Database): Promise<AdminUserRecord[]> {
  const result = await db
    .prepare(
      `SELECT id, email, role, display_name, active, created_at
       FROM users ORDER BY email COLLATE NOCASE`,
    )
    .all<{
      id: string
      email: string
      role: UserRole
      display_name: string | null
      active: number
      created_at: string
    }>()

  return result.results.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    active: row.active === 1,
    createdAt: row.created_at,
  }))
}

export async function createUser(
  db: D1Database,
  input: { email: string; password: string; role: UserRole; displayName?: string },
): Promise<AdminUserRecord | { error: string }> {
  const email = input.email.trim().toLowerCase()
  if (!email || !input.password) {
    return { error: 'Email and password are required' }
  }

  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE')
    .bind(email)
    .first()
  if (existing) {
    return { error: 'A user with this email already exists' }
  }

  const id = crypto.randomUUID()
  const passwordHash = await createPasswordHash(input.password)
  const createdAt = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, role, display_name, active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
    )
    .bind(id, email, passwordHash, input.role, input.displayName?.trim() || null, createdAt)
    .run()

  return {
    id,
    email,
    displayName: input.displayName?.trim() || null,
    role: input.role,
    active: true,
    createdAt,
  }
}

export async function updateUser(
  db: D1Database,
  userId: string,
  input: { email?: string; role?: UserRole; displayName?: string | null; active?: boolean; password?: string },
): Promise<AdminUserRecord | { error: string }> {
  const existing = await db
    .prepare('SELECT id, email, role, display_name, active, created_at FROM users WHERE id = ?')
    .bind(userId)
    .first<{
      id: string
      email: string
      role: UserRole
      display_name: string | null
      active: number
      created_at: string
    }>()

  if (!existing) {
    return { error: 'User not found' }
  }

  if (input.active === false && existing.role === 'admin') {
    const adminCount = await db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND active = 1")
      .first<{ count: number }>()
    if ((adminCount?.count ?? 0) <= 1) {
      return { error: 'Cannot deactivate the last active admin' }
    }
  }

  if (input.email) {
    const email = input.email.trim().toLowerCase()
    const duplicate = await db
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
      .bind(email, userId)
      .first()
    if (duplicate) {
      return { error: 'A user with this email already exists' }
    }
  }

  const email = input.email?.trim().toLowerCase() ?? existing.email
  const role = input.role ?? existing.role
  const displayName =
    input.displayName !== undefined ? input.displayName?.trim() || null : existing.display_name
  const active = input.active !== undefined ? (input.active ? 1 : 0) : existing.active

  let passwordHash: string | undefined
  if (input.password) {
    passwordHash = await createPasswordHash(input.password)
  }

  if (passwordHash) {
    await db
      .prepare(
        `UPDATE users SET email = ?, role = ?, display_name = ?, active = ?, password_hash = ? WHERE id = ?`,
      )
      .bind(email, role, displayName, active, passwordHash, userId)
      .run()
  } else {
    await db
      .prepare(`UPDATE users SET email = ?, role = ?, display_name = ?, active = ? WHERE id = ?`)
      .bind(email, role, displayName, active, userId)
      .run()
  }

  if (active === 0) {
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run()
  }

  return {
    id: userId,
    email,
    displayName,
    role,
    active: active === 1,
    createdAt: existing.created_at,
  }
}

export async function deleteUser(db: D1Database, userId: string): Promise<{ success: true } | { error: string }> {
  const existing = await db
    .prepare('SELECT id, role, active FROM users WHERE id = ?')
    .bind(userId)
    .first<{ id: string; role: UserRole; active: number }>()

  if (!existing) {
    return { error: 'User not found' }
  }

  if (existing.role === 'admin' && existing.active === 1) {
    const adminCount = await db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND active = 1")
      .first<{ count: number }>()
    if ((adminCount?.count ?? 0) <= 1) {
      return { error: 'Cannot delete the last active admin' }
    }
  }

  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
  return { success: true }
}

export function unauthorizedResponse(): Response {
  return jsonResponse({ error: 'Unauthorized' }, 401)
}

export function forbiddenResponse(): Response {
  return jsonResponse({ error: 'Forbidden' }, 403)
}

export function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  })
}
