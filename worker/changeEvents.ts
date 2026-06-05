import type { AuthUser } from './auth'

export type OkrEntityType = 'period' | 'objective' | 'key_result'
export type ChangeAction = 'created' | 'updated' | 'deleted' | 'saved'

type KeyResultState = {
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
}

type ObjectiveState = {
  id: string
  objectiveId: string
  title: string
  description?: string
  owner: string
  weight: number
  status: string
  keyResults: KeyResultState[]
}

type PeriodState = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  objectives: ObjectiveState[]
}

export type ChangeEventRecord = {
  entityType: OkrEntityType
  entityId: string
  periodId: string
  entityLabel: string
  action: ChangeAction
  field?: string
  oldValue?: string | null
  newValue?: string | null
}

type ChangeItem = {
  kind: 'created' | 'updated' | 'deleted'
  entityType: OkrEntityType
  label: string
  field?: string
  oldValue?: string
  newValue?: string
  periodId: string
}

const PERIOD_FIELDS = ['name', 'startDate', 'endDate', 'status'] as const
const OBJECTIVE_FIELDS = ['title', 'description', 'owner', 'weight', 'status'] as const
const KEY_RESULT_FIELDS = [
  'title',
  'owner',
  'baseline',
  'target',
  'current',
  'weight',
  'confidence',
  'notes',
] as const

const FIELD_LABELS: Record<string, string> = {
  name: 'name',
  startDate: 'start date',
  endDate: 'end date',
  status: 'status',
  title: 'title',
  description: 'description',
  owner: 'owner',
  weight: 'weight',
  baseline: 'baseline',
  target: 'target',
  current: 'current',
  confidence: 'confidence',
  notes: 'notes',
}

function serializeValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return String(value)
  return String(value)
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return serializeValue(a) === serializeValue(b)
}

function diffFields<T extends Record<string, unknown>>(
  oldEntity: T,
  newEntity: T,
  fields: readonly string[],
): Array<{ field: string; oldValue: string; newValue: string }> {
  const changes: Array<{ field: string; oldValue: string; newValue: string }> = []

  for (const field of fields) {
    const oldValue = oldEntity[field]
    const newValue = newEntity[field]
    if (!valuesEqual(oldValue, newValue)) {
      changes.push({
        field,
        oldValue: serializeValue(oldValue),
        newValue: serializeValue(newValue),
      })
    }
  }

  return changes
}

function periodLabel(period: PeriodState): string {
  return period.name
}

function objectiveLabel(objective: ObjectiveState): string {
  return `${objective.objectiveId}: ${objective.title}`
}

function keyResultLabel(kr: KeyResultState): string {
  return `${kr.keyResultId}: ${kr.title}`
}

function collectChanges(oldPeriods: PeriodState[], newPeriods: PeriodState[]): ChangeItem[] {
  const items: ChangeItem[] = []
  const oldPeriodMap = new Map(oldPeriods.map((p) => [p.id, p]))
  const newPeriodMap = new Map(newPeriods.map((p) => [p.id, p]))

  for (const period of newPeriods) {
    const oldPeriod = oldPeriodMap.get(period.id)
    if (!oldPeriod) {
      items.push({
        kind: 'created',
        entityType: 'period',
        label: periodLabel(period),
        periodId: period.id,
      })
    } else {
      for (const change of diffFields(oldPeriod, period, PERIOD_FIELDS)) {
        items.push({
          kind: 'updated',
          entityType: 'period',
          label: periodLabel(period),
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          periodId: period.id,
        })
      }
    }

    const oldObjectives = oldPeriod?.objectives ?? []
    const oldObjectiveMap = new Map(oldObjectives.map((o) => [o.id, o]))

    for (const objective of period.objectives) {
      const oldObjective = oldObjectiveMap.get(objective.id)
      if (!oldObjective) {
        items.push({
          kind: 'created',
          entityType: 'objective',
          label: objectiveLabel(objective),
          periodId: period.id,
        })
      } else {
        for (const change of diffFields(oldObjective, objective, OBJECTIVE_FIELDS)) {
          items.push({
            kind: 'updated',
            entityType: 'objective',
            label: objectiveLabel(objective),
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
            periodId: period.id,
          })
        }
      }

      const oldKeyResults = oldObjective?.keyResults ?? []
      const oldKrMap = new Map(oldKeyResults.map((kr) => [kr.id, kr]))

      for (const kr of objective.keyResults) {
        const oldKr = oldKrMap.get(kr.id)
        if (!oldKr) {
          items.push({
            kind: 'created',
            entityType: 'key_result',
            label: keyResultLabel(kr),
            periodId: period.id,
          })
        } else {
          for (const change of diffFields(oldKr, kr, KEY_RESULT_FIELDS)) {
            items.push({
              kind: 'updated',
              entityType: 'key_result',
              label: keyResultLabel(kr),
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
              periodId: period.id,
            })
          }
        }
      }

      for (const oldKr of oldKeyResults) {
        if (!objective.keyResults.some((kr) => kr.id === oldKr.id)) {
          items.push({
            kind: 'deleted',
            entityType: 'key_result',
            label: keyResultLabel(oldKr),
            periodId: period.id,
          })
        }
      }
    }

    for (const oldObjective of oldObjectives) {
      if (!period.objectives.some((o) => o.id === oldObjective.id)) {
        items.push({
          kind: 'deleted',
          entityType: 'objective',
          label: objectiveLabel(oldObjective),
          periodId: period.id,
        })
      }
    }
  }

  for (const oldPeriod of oldPeriods) {
    if (!newPeriodMap.has(oldPeriod.id)) {
      items.push({
        kind: 'deleted',
        entityType: 'period',
        label: periodLabel(oldPeriod),
        periodId: oldPeriod.id,
      })
    }
  }

  return items
}

function formatChangeItem(item: ChangeItem): string {
  if (item.kind === 'created') return `Added ${item.label}`
  if (item.kind === 'deleted') return `Removed ${item.label}`

  const fieldLabel = item.field ? (FIELD_LABELS[item.field] ?? item.field) : 'field'
  return `${item.label}: ${fieldLabel} ${item.oldValue} → ${item.newValue}`
}

function formatChangeSummary(items: ChangeItem[]): string {
  const maxItems = 12
  const visible = items.slice(0, maxItems).map(formatChangeItem)
  if (items.length > maxItems) {
    visible.push(`and ${items.length - maxItems} more change(s)`)
  }
  return visible.join('; ')
}

export function buildSaveEvent(
  oldPeriods: PeriodState[],
  newPeriods: PeriodState[],
  focusedPeriodId: string | null,
): ChangeEventRecord | null {
  const changes = collectChanges(oldPeriods, newPeriods)
  if (changes.length === 0) return null

  const periodId =
    focusedPeriodId && newPeriods.some((period) => period.id === focusedPeriodId)
      ? focusedPeriodId
      : (changes[0]?.periodId ?? newPeriods[0]?.id)

  if (!periodId) return null

  const period = newPeriods.find((entry) => entry.id === periodId) ?? newPeriods[0]
  if (!period) return null

  return {
    entityType: 'period',
    entityId: period.id,
    periodId: period.id,
    entityLabel: periodLabel(period),
    action: 'saved',
    field: 'summary',
    newValue: formatChangeSummary(changes),
  }
}

export async function insertChangeEvents(
  db: D1Database,
  events: ChangeEventRecord[],
  user: AuthUser,
): Promise<void> {
  if (events.length === 0) return

  const userDisplay = user.displayName?.trim() || user.email
  const createdAt = new Date().toISOString()
  const statements: D1PreparedStatement[] = []

  for (const event of events) {
    statements.push(
      db
        .prepare(
          `INSERT INTO change_events
           (id, entity_type, entity_id, period_id, entity_label, action, field, old_value, new_value, user_id, user_display, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          event.entityType,
          event.entityId,
          event.periodId,
          event.entityLabel,
          event.action,
          event.field ?? null,
          event.oldValue ?? null,
          event.newValue ?? null,
          user.id,
          userDisplay,
          createdAt,
        ),
    )
  }

  await db.batch(statements)
}

export type ChangeEventRow = {
  id: string
  entity_type: OkrEntityType
  entity_id: string
  period_id: string
  entity_label: string
  action: ChangeAction
  field: string | null
  old_value: string | null
  new_value: string | null
  user_id: string | null
  user_display: string
  created_at: string
}

export async function listChangeEvents(
  db: D1Database,
  options: {
    entityType?: OkrEntityType
    entityId?: string
    periodId?: string
    action?: ChangeAction
    limit?: number
  },
): Promise<ChangeEventRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100)
  const conditions: string[] = []
  const bindings: unknown[] = []

  if (options.entityType) {
    conditions.push('entity_type = ?')
    bindings.push(options.entityType)
  }
  if (options.entityId) {
    conditions.push('entity_id = ?')
    bindings.push(options.entityId)
  }
  if (options.periodId) {
    conditions.push('period_id = ?')
    bindings.push(options.periodId)
  }
  if (options.action) {
    conditions.push('action = ?')
    bindings.push(options.action)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await db
    .prepare(
      `SELECT id, entity_type, entity_id, period_id, entity_label, action, field, old_value, new_value, user_id, user_display, created_at
       FROM change_events
       ${where}
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(...bindings, limit)
    .all<ChangeEventRow>()

  return result.results
}
