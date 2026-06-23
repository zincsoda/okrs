import type { PlanningPeriod } from '../types'

type ChangeItem = {
  kind: 'created' | 'updated' | 'deleted'
  entityType: 'period' | 'objective' | 'key_result'
  periodName: string
  label: string
  field?: string
  oldValue?: string
  newValue?: string
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

function periodLabel(period: PlanningPeriod): string {
  return period.name
}

function objectiveLabel(objective: PlanningPeriod['objectives'][number]): string {
  return `${objective.objectiveId}: ${objective.title}`
}

function keyResultLabel(kr: PlanningPeriod['objectives'][number]['keyResults'][number]): string {
  return `${kr.keyResultId}: ${kr.title}`
}

function collectChanges(serverPeriods: PlanningPeriod[], localPeriods: PlanningPeriod[]): ChangeItem[] {
  const items: ChangeItem[] = []
  const serverPeriodMap = new Map(serverPeriods.map((period) => [period.id, period]))
  const localPeriodMap = new Map(localPeriods.map((period) => [period.id, period]))

  for (const period of localPeriods) {
    const serverPeriod = serverPeriodMap.get(period.id)
    const periodName = periodLabel(period)

    if (!serverPeriod) {
      items.push({
        kind: 'created',
        entityType: 'period',
        periodName,
        label: periodLabel(period),
      })
    } else {
      for (const change of diffFields(serverPeriod, period, PERIOD_FIELDS)) {
        items.push({
          kind: 'updated',
          entityType: 'period',
          periodName,
          label: periodLabel(period),
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        })
      }
    }

    const serverObjectives = serverPeriod?.objectives ?? []
    const serverObjectiveMap = new Map(serverObjectives.map((objective) => [objective.id, objective]))

    for (const objective of period.objectives) {
      const serverObjective = serverObjectiveMap.get(objective.id)

      if (!serverObjective) {
        items.push({
          kind: 'created',
          entityType: 'objective',
          periodName,
          label: objectiveLabel(objective),
        })
      } else {
        for (const change of diffFields(serverObjective, objective, OBJECTIVE_FIELDS)) {
          items.push({
            kind: 'updated',
            entityType: 'objective',
            periodName,
            label: objectiveLabel(objective),
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue,
          })
        }
      }

      const serverKeyResults = serverObjective?.keyResults ?? []
      const serverKrMap = new Map(serverKeyResults.map((kr) => [kr.id, kr]))

      for (const kr of objective.keyResults) {
        const serverKr = serverKrMap.get(kr.id)

        if (!serverKr) {
          items.push({
            kind: 'created',
            entityType: 'key_result',
            periodName,
            label: keyResultLabel(kr),
          })
        } else {
          for (const change of diffFields(serverKr, kr, KEY_RESULT_FIELDS)) {
            items.push({
              kind: 'updated',
              entityType: 'key_result',
              periodName,
              label: keyResultLabel(kr),
              field: change.field,
              oldValue: change.oldValue,
              newValue: change.newValue,
            })
          }
        }
      }

      for (const serverKr of serverKeyResults) {
        if (!objective.keyResults.some((kr) => kr.id === serverKr.id)) {
          items.push({
            kind: 'deleted',
            entityType: 'key_result',
            periodName,
            label: keyResultLabel(serverKr),
          })
        }
      }
    }

    for (const serverObjective of serverObjectives) {
      if (!period.objectives.some((objective) => objective.id === serverObjective.id)) {
        items.push({
          kind: 'deleted',
          entityType: 'objective',
          periodName,
          label: objectiveLabel(serverObjective),
        })
      }
    }
  }

  for (const serverPeriod of serverPeriods) {
    if (!localPeriodMap.has(serverPeriod.id)) {
      items.push({
        kind: 'deleted',
        entityType: 'period',
        periodName: periodLabel(serverPeriod),
        label: periodLabel(serverPeriod),
      })
    }
  }

  return items
}

function formatChangeItem(item: ChangeItem): string {
  if (item.kind === 'created') {
    return `Added ${item.label}`
  }
  if (item.kind === 'deleted') {
    return `Removed ${item.label}`
  }

  const fieldLabel = item.field ? (FIELD_LABELS[item.field] ?? item.field) : 'field'
  return `${item.label}: ${fieldLabel} "${item.oldValue}" → "${item.newValue}"`
}

function formatSelectedPeriodChange(
  serverPeriods: PlanningPeriod[],
  localSelectedPeriodId: string | null,
  serverSelectedPeriodId: string | null,
): string | null {
  if (localSelectedPeriodId === serverSelectedPeriodId) {
    return null
  }

  const labelFor = (periodId: string | null) => {
    if (!periodId) return '(none)'
    const period = serverPeriods.find((entry) => entry.id === periodId)
    return period ? period.name : periodId
  }

  return `Selected period: "${labelFor(serverSelectedPeriodId)}" → "${labelFor(localSelectedPeriodId)}"`
}

export function formatLocalChangesForClipboard(input: {
  serverPeriods: PlanningPeriod[]
  localPeriods: PlanningPeriod[]
  serverSelectedPeriodId: string | null
  localSelectedPeriodId: string | null
}): string {
  const items = collectChanges(input.serverPeriods, input.localPeriods)
  const selectedPeriodChange = formatSelectedPeriodChange(
    [...input.serverPeriods, ...input.localPeriods],
    input.localSelectedPeriodId,
    input.serverSelectedPeriodId,
  )

  const lines = [
    'Unsaved OKR changes',
    `Copied ${new Date().toLocaleString()}`,
    '',
  ]

  if (items.length === 0 && !selectedPeriodChange) {
    lines.push('No differences found between your edits and the server.')
    return lines.join('\n')
  }

  const grouped = new Map<string, ChangeItem[]>()
  for (const item of items) {
    const list = grouped.get(item.periodName) ?? []
    list.push(item)
    grouped.set(item.periodName, list)
  }

  if (selectedPeriodChange) {
    lines.push(selectedPeriodChange, '')
  }

  for (const [periodName, periodItems] of grouped) {
    lines.push(periodName)
    for (const item of periodItems) {
      lines.push(`- ${formatChangeItem(item)}`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}
