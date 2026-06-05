#!/usr/bin/env node
/**
 * Copies user accounts from remote D1 into the local dev database.
 * Passwords are unchanged — use the same credentials as production.
 *
 *   npm run users:sync
 */

import { execFileSync } from 'node:child_process'
import { writeFile, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempSql = path.join(rootDir, 'scripts/.users-sync.sql')

function runD1(command, remote) {
  const args = [
    'wrangler',
    'd1',
    'execute',
    'tech-okr-db',
    remote ? '--remote' : '--local',
    '--command',
    command,
  ]

  const output = execFileSync('npx', args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const jsonStart = output.indexOf('[')
  if (jsonStart === -1) {
    throw new Error(`Unexpected wrangler output:\n${output}`)
  }

  const parsed = JSON.parse(output.slice(jsonStart))
  return parsed[0]?.results ?? []
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

const users = runD1(
  'SELECT id, email, password_hash, role, display_name, active, created_at FROM users',
  true,
)

if (users.length === 0) {
  console.error('No users found in remote D1. Create one with: npm run admin:create')
  process.exit(1)
}

const statements = [
  'DELETE FROM sessions;',
  ...users.map(
    (user) =>
      `INSERT OR REPLACE INTO users (id, email, password_hash, role, display_name, active, created_at)
       VALUES (${sqlString(user.id)}, ${sqlString(user.email)}, ${sqlString(user.password_hash)}, ${sqlString(user.role)}, ${user.display_name ? sqlString(user.display_name) : 'NULL'}, ${user.active}, ${sqlString(user.created_at)});`,
  ),
]

await writeFile(tempSql, statements.join('\n'))

try {
  execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'tech-okr-db', '--local', '--file', tempSql],
    { cwd: rootDir, stdio: 'inherit' },
  )
} finally {
  await unlink(tempSql).catch(() => {})
}

console.log(`Synced ${users.length} user(s) to local D1:`)
for (const user of users) {
  console.log(`  - ${user.email} (${user.role})`)
}
