import type { KeyResult, Objective, PlanningPeriod } from '../types'
import {
  calculateKrProgress,
  calculateObjectiveProgress,
  progressToPercent,
} from './calculations'

const CSV_HEADERS = [
  'Period Name',
  'Period Start Date',
  'Period End Date',
  'Period Status',
  'Objective ID',
  'Objective Title',
  'Objective Description',
  'Objective Owner',
  'Objective Weight',
  'Objective Status',
  'Objective Progress (%)',
  'Key Result ID',
  'Key Result Title',
  'Key Result Owner',
  'Key Result Baseline',
  'Key Result Target',
  'Key Result Current',
  'Key Result Progress (%)',
  'Key Result Weight',
  'Key Result Confidence',
  'Key Result Notes',
] as const

export function escapeCsvField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''

  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function objectiveRowPrefix(period: PlanningPeriod, objective: Objective): string[] {
  const objectiveProgress = progressToPercent(calculateObjectiveProgress(objective.keyResults))

  return [
    period.name,
    period.startDate,
    period.endDate,
    period.status,
    objective.objectiveId,
    objective.title,
    objective.description ?? '',
    objective.owner,
    objective.weight,
    objective.status,
    objectiveProgress,
  ].map(escapeCsvField)
}

function keyResultRowSuffix(kr: KeyResult): string[] {
  const krProgress = progressToPercent(
    calculateKrProgress(kr.baseline, kr.target, kr.current),
  )

  return [
    kr.keyResultId,
    kr.title,
    kr.owner,
    kr.baseline,
    kr.target,
    kr.current,
    krProgress,
    kr.weight,
    kr.confidence,
    kr.notes ?? '',
  ].map(escapeCsvField)
}

function emptyKeyResultRowSuffix(): string[] {
  return Array.from({ length: 10 }, () => '')
}

export function buildOkrCsv(periods: PlanningPeriod[]): string {
  const rows: string[] = [CSV_HEADERS.join(',')]

  for (const period of periods) {
    for (const objective of period.objectives) {
      const prefix = objectiveRowPrefix(period, objective)

      if (objective.keyResults.length === 0) {
        rows.push([...prefix, ...emptyKeyResultRowSuffix()].join(','))
        continue
      }

      for (const keyResult of objective.keyResults) {
        rows.push([...prefix, ...keyResultRowSuffix(keyResult)].join(','))
      }
    }
  }

  return rows.join('\n')
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildOkrCsvFilename(periods: PlanningPeriod[]): string {
  const dateStamp = new Date().toISOString().slice(0, 10)

  if (periods.length === 1) {
    const slug = sanitizeFilenamePart(periods[0].name) || 'period'
    return `okrs-${slug}-${dateStamp}.csv`
  }

  return `okrs-all-periods-${dateStamp}.csv`
}

export function downloadOkrCsv(periods: PlanningPeriod[], filename?: string): void {
  if (periods.length === 0) return

  const csv = buildOkrCsv(periods)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename ?? buildOkrCsvFilename(periods)
  link.click()
  URL.revokeObjectURL(url)
}
