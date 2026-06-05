import {
  changeOwnPassword,
  createUser,
  deleteUser,
  forbiddenResponse,
  getSessionUser,
  hasMinRole,
  jsonResponse,
  listUsers,
  loginUser,
  logoutUser,
  unauthorizedResponse,
  updateUser,
  type UserRole,
} from './auth'
import {
  buildSaveEvent,
  insertChangeEvents,
  listChangeEvents,
  type ChangeAction,
  type OkrEntityType,
} from './changeEvents'

export interface Env {
  DB: D1Database
  ASSETS: Fetcher
}

type PeriodRow = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

type ObjectiveRow = {
  id: string
  period_id: string
  objective_id: string
  title: string
  description: string | null
  owner: string
  weight: number
  status: string
}

type KeyResultRow = {
  id: string
  objective_id: string
  key_result_id: string
  title: string
  owner: string
  baseline: number
  target: number
  current: number
  weight: number
  confidence: string
  notes: string | null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env)
    }

    return env.ASSETS.fetch(request)
  },
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)

  try {
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const body = (await request.json()) as { email?: string; password?: string }
      if (!body.email || !body.password) {
        return jsonResponse({ error: 'Email and password are required' }, 400)
      }

      const result = await loginUser(env.DB, body.email, body.password, url.protocol === 'https:')
      if ('error' in result) {
        return jsonResponse({ error: result.error }, 401)
      }

      return jsonResponse({ user: result.user }, 200, { 'Set-Cookie': result.setCookie })
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      const clearCookie = await logoutUser(env.DB, request, url.protocol === 'https:')
      return jsonResponse({ success: true }, 200, { 'Set-Cookie': clearCookie })
    }

    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      const user = await getSessionUser(env.DB, request)
      if (!user) {
        return jsonResponse({ user: null }, 200)
      }
      return jsonResponse({ user })
    }

    if (url.pathname === '/api/auth/change-password' && request.method === 'POST') {
      const user = await getSessionUser(env.DB, request)
      if (!user) {
        return unauthorizedResponse()
      }

      const body = (await request.json()) as { currentPassword?: string; newPassword?: string }
      if (!body.currentPassword || !body.newPassword) {
        return jsonResponse({ error: 'Current and new password are required' }, 400)
      }

      const result = await changeOwnPassword(
        env.DB,
        request,
        user.id,
        body.currentPassword,
        body.newPassword,
      )

      if ('error' in result) {
        const status = result.error === 'Current password is incorrect' ? 401 : 400
        return jsonResponse({ error: result.error }, status)
      }

      return jsonResponse({ success: true })
    }

    if (url.pathname.startsWith('/api/admin/users')) {
      return handleAdminUsers(request, env, url)
    }

    if (request.method === 'GET' && url.pathname === '/api/state') {
      const user = await getSessionUser(env.DB, request)
      if (!user) {
        return unauthorizedResponse()
      }
      return jsonResponse(await loadState(env))
    }

    if (request.method === 'GET' && url.pathname === '/api/change-events') {
      const user = await getSessionUser(env.DB, request)
      if (!user) {
        return unauthorizedResponse()
      }

      const entityType = url.searchParams.get('entityType') as OkrEntityType | null
      const entityId = url.searchParams.get('entityId')
      const periodId = url.searchParams.get('periodId')
      const action = url.searchParams.get('action') as ChangeAction | null
      const limitParam = url.searchParams.get('limit')
      const limit = limitParam ? Number.parseInt(limitParam, 10) : 20

      if (entityType && !['period', 'objective', 'key_result'].includes(entityType)) {
        return jsonResponse({ error: 'Invalid entityType' }, 400)
      }

      if (action && !['created', 'updated', 'deleted', 'saved'].includes(action)) {
        return jsonResponse({ error: 'Invalid action' }, 400)
      }

      if (!entityId && !periodId) {
        return jsonResponse({ error: 'entityId or periodId is required' }, 400)
      }

      const rows = await listChangeEvents(env.DB, {
        entityType: entityType ?? undefined,
        entityId: entityId ?? undefined,
        periodId: periodId ?? undefined,
        action: action ?? undefined,
        limit: Number.isFinite(limit) ? limit : 20,
      })

      return jsonResponse({
        events: rows.map((row) => ({
          id: row.id,
          entityType: row.entity_type,
          entityId: row.entity_id,
          periodId: row.period_id,
          entityLabel: row.entity_label,
          action: row.action,
          field: row.field,
          oldValue: row.old_value,
          newValue: row.new_value,
          userDisplay: row.user_display,
          createdAt: row.created_at,
        })),
      })
    }

    if (request.method === 'PUT' && url.pathname === '/api/state') {
      const user = await getSessionUser(env.DB, request)
      if (!user) {
        return unauthorizedResponse()
      }
      if (!hasMinRole(user.role, 'editor')) {
        return forbiddenResponse()
      }

      const body = (await request.json()) as {
        periods: Array<{
          id: string
          name: string
          startDate: string
          endDate: string
          status: string
          objectives: Array<{
            id: string
            objectiveId: string
            title: string
            description?: string
            owner: string
            weight: number
            status: string
            keyResults: Array<{
              id: string
              keyResultId: string
              title: string
              owner: string
              baseline: number
              target: number
              current: number
              weight: number
              confidence: string
              notes?: string
            }>
          }>
        }>
        selectedPeriodId?: string | null
        recordSave?: boolean
      }

      if (body.recordSave) {
        const previousState = await loadState(env)
        const saveEvent = buildSaveEvent(
          previousState.periods,
          body.periods,
          body.selectedPeriodId ?? null,
        )
        if (saveEvent) {
          await insertChangeEvents(env.DB, [saveEvent], user)
        }
      }

      await saveState(env, body.periods, body.selectedPeriodId ?? null)
      return jsonResponse({ success: true })
    }

    if (request.method === 'PUT' && url.pathname === '/api/settings') {
      const user = await getSessionUser(env.DB, request)
      if (!user) {
        return unauthorizedResponse()
      }

      const body = (await request.json()) as { selectedPeriodId?: string | null }
      await saveSelectedPeriodId(env, body.selectedPeriodId ?? null)
      return jsonResponse({ success: true })
    }

    return jsonResponse({ error: 'Not found' }, 404)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
}

async function handleAdminUsers(request: Request, env: Env, url: URL): Promise<Response> {
  const user = await getSessionUser(env.DB, request)
  if (!user) {
    return unauthorizedResponse()
  }
  if (!hasMinRole(user.role, 'admin')) {
    return forbiddenResponse()
  }

  if (url.pathname === '/api/admin/users' && request.method === 'GET') {
    const users = await listUsers(env.DB)
    return jsonResponse({ users })
  }

  if (url.pathname === '/api/admin/users' && request.method === 'POST') {
    const body = (await request.json()) as {
      email?: string
      password?: string
      role?: UserRole
      displayName?: string
    }

    if (!body.email || !body.password || !body.role) {
      return jsonResponse({ error: 'Email, password, and role are required' }, 400)
    }

    if (!['admin', 'editor', 'viewer'].includes(body.role)) {
      return jsonResponse({ error: 'Invalid role' }, 400)
    }

    const result = await createUser(env.DB, {
      email: body.email,
      password: body.password,
      role: body.role,
      displayName: body.displayName,
    })

    if ('error' in result) {
      return jsonResponse({ error: result.error }, 400)
    }

    return jsonResponse({ user: result }, 201)
  }

  const match = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/)
  if (match) {
    const userId = match[1]

    if (request.method === 'PUT') {
      const body = (await request.json()) as {
        email?: string
        password?: string
        role?: UserRole
        displayName?: string | null
        active?: boolean
      }

      if (body.role && !['admin', 'editor', 'viewer'].includes(body.role)) {
        return jsonResponse({ error: 'Invalid role' }, 400)
      }

      const result = await updateUser(env.DB, userId, body)
      if ('error' in result) {
        return jsonResponse({ error: result.error }, 400)
      }

      return jsonResponse({ user: result })
    }

    if (request.method === 'DELETE') {
      const result = await deleteUser(env.DB, userId)
      if ('error' in result) {
        return jsonResponse({ error: result.error }, 400)
      }
      return jsonResponse({ success: true })
    }
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

async function loadState(env: Env) {
  const periodsResult = await env.DB.prepare(
    'SELECT id, name, start_date, end_date, status FROM planning_periods ORDER BY start_date',
  ).all<PeriodRow>()

  const objectivesResult = await env.DB.prepare(
    'SELECT id, period_id, objective_id, title, description, owner, weight, status FROM objectives',
  ).all<ObjectiveRow>()

  const keyResultsResult = await env.DB.prepare(
    `SELECT id, objective_id, key_result_id, title, owner, baseline, target, current, weight, confidence, notes
     FROM key_results`,
  ).all<KeyResultRow>()

  const settingsResult = await env.DB.prepare('SELECT key, value FROM app_settings').all<{
    key: string
    value: string
  }>()

  const settings = new Map(settingsResult.results.map((row) => [row.key, row.value]))

  const keyResultsByObjective = new Map<string, KeyResultRow[]>()
  for (const kr of keyResultsResult.results) {
    const list = keyResultsByObjective.get(kr.objective_id) ?? []
    list.push(kr)
    keyResultsByObjective.set(kr.objective_id, list)
  }

  const objectivesByPeriod = new Map<string, ObjectiveRow[]>()
  for (const objective of objectivesResult.results) {
    const list = objectivesByPeriod.get(objective.period_id) ?? []
    list.push(objective)
    objectivesByPeriod.set(objective.period_id, list)
  }

  const periods = periodsResult.results.map((period) => ({
    id: period.id,
    name: period.name,
    startDate: period.start_date,
    endDate: period.end_date,
    status: period.status,
    objectives: (objectivesByPeriod.get(period.id) ?? []).map((objective) => ({
      id: objective.id,
      objectiveId: objective.objective_id,
      title: objective.title,
      description: objective.description ?? undefined,
      owner: objective.owner,
      weight: objective.weight,
      status: objective.status,
      keyResults: (keyResultsByObjective.get(objective.id) ?? []).map((kr) => ({
        id: kr.id,
        keyResultId: kr.key_result_id,
        title: kr.title,
        owner: kr.owner,
        baseline: kr.baseline,
        target: kr.target,
        current: kr.current,
        weight: kr.weight,
        confidence: kr.confidence,
        notes: kr.notes ?? undefined,
      })),
    })),
  }))

  return {
    periods,
    selectedPeriodId: settings.get('selectedPeriodId') ?? null,
  }
}

async function saveState(
  env: Env,
  periods: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    status: string
    objectives: Array<{
      id: string
      objectiveId: string
      title: string
      description?: string
      owner: string
      weight: number
      status: string
      keyResults: Array<{
        id: string
        keyResultId: string
        title: string
        owner: string
        baseline: number
        target: number
        current: number
        weight: number
        confidence: string
        notes?: string
      }>
    }>
  }>,
  selectedPeriodId: string | null,
) {
  const statements: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM key_results'),
    env.DB.prepare('DELETE FROM objectives'),
    env.DB.prepare('DELETE FROM planning_periods'),
    env.DB.prepare('DELETE FROM app_settings'),
  ]

  for (const period of periods) {
    statements.push(
      env.DB.prepare(
        'INSERT INTO planning_periods (id, name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
      ).bind(period.id, period.name, period.startDate, period.endDate, period.status),
    )

    for (const objective of period.objectives) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO objectives (id, period_id, objective_id, title, description, owner, weight, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          objective.id,
          period.id,
          objective.objectiveId,
          objective.title,
          objective.description ?? null,
          objective.owner,
          objective.weight,
          objective.status,
        ),
      )

      for (const kr of objective.keyResults) {
        statements.push(
          env.DB.prepare(
            `INSERT INTO key_results
             (id, objective_id, key_result_id, title, owner, baseline, target, current, weight, confidence, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).bind(
            kr.id,
            objective.id,
            kr.keyResultId,
            kr.title,
            kr.owner,
            kr.baseline,
            kr.target,
            kr.current,
            kr.weight,
            kr.confidence,
            kr.notes ?? null,
          ),
        )
      }
    }
  }

  if (selectedPeriodId) {
    statements.push(
      env.DB.prepare("INSERT INTO app_settings (key, value) VALUES ('selectedPeriodId', ?)").bind(
        selectedPeriodId,
      ),
    )
  }

  await env.DB.batch(statements)
}

async function saveSelectedPeriodId(env: Env, selectedPeriodId: string | null) {
  if (selectedPeriodId) {
    await env.DB.prepare(
      "INSERT INTO app_settings (key, value) VALUES ('selectedPeriodId', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
      .bind(selectedPeriodId)
      .run()
  } else {
    await env.DB.prepare("DELETE FROM app_settings WHERE key = 'selectedPeriodId'").run()
  }
}
