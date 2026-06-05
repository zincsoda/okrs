#!/usr/bin/env node
/**
 * Creates the first admin user. Run after applying migration 0004_users.sql:
 *
 *   node scripts/create-admin.mjs admin@example.com "YourPassword" "Admin Name"
 *
 * Then apply to remote D1:
 *   npx wrangler d1 execute tech-okr-db --remote --file=scripts/.admin-insert.sql
 */

import { webcrypto } from 'node:crypto'

const PBKDF2_ITERATIONS = 100_000

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password) {
  const saltBytes = webcrypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await webcrypto.subtle.deriveBits(
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

const [email, password, displayName = 'Admin'] = process.argv.slice(2)

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [displayName]')
  process.exit(1)
}

const id = webcrypto.randomUUID()
const passwordHash = await hashPassword(password)
const createdAt = new Date().toISOString()
const normalizedEmail = email.trim().toLowerCase()

const sql = `-- Bootstrap admin for ${normalizedEmail}
INSERT INTO users (id, email, password_hash, role, display_name, active, created_at)
VALUES ('${id}', '${normalizedEmail}', '${passwordHash}', 'admin', '${displayName.replace(/'/g, "''")}', 1, '${createdAt}');
`

await import('node:fs/promises').then((fs) =>
  fs.writeFile(new URL('./.admin-insert.sql', import.meta.url), sql),
)

console.log(`Wrote scripts/.admin-insert.sql for ${normalizedEmail}`)
console.log('Apply locally:  npx wrangler d1 execute tech-okr-db --local --file=scripts/.admin-insert.sql')
console.log('Apply remotely: npx wrangler d1 execute tech-okr-db --remote --file=scripts/.admin-insert.sql')
