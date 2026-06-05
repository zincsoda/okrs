import type { KeyResult, Objective, PlanningPeriod } from '../types'

/** KR progress as a decimal (0–1). Clamped; supports decreasing targets. */
export function calculateKrProgress(
  baseline: number,
  target: number,
  current: number,
): number {
  if (baseline === target) return 0

  const range = target - baseline
  const raw = (current - baseline) / range

  return Math.min(1, Math.max(0, raw))
}

/** Weighted sum of KR progress. Returns 0 when there are no KRs. */
export function calculateObjectiveProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0

  return keyResults.reduce(
    (sum, kr) => sum + calculateKrProgress(kr.baseline, kr.target, kr.current) * kr.weight,
    0,
  )
}

/** Weighted sum of objective progress across a period. */
export function calculatePeriodProgress(objectives: Objective[]): number {
  if (objectives.length === 0) return 0

  return objectives.reduce(
    (sum, obj) => sum + calculateObjectiveProgress(obj.keyResults) * obj.weight,
    0,
  )
}

/** Convert internal decimal progress to a display percentage (0–100). */
export function progressToPercent(progress: number): number {
  return Math.round(progress * 100)
}

/** Tailwind color class based on progress percentage thresholds. */
export function getProgressColorClass(percent: number): string {
  if (percent >= 70) return 'bg-emerald-500'
  if (percent >= 40) return 'bg-amber-400'
  return 'bg-red-500'
}

/** Text color variant for progress values. */
export function getProgressTextColorClass(percent: number): string {
  if (percent >= 70) return 'text-emerald-600'
  if (percent >= 40) return 'text-amber-600'
  return 'text-red-600'
}

export function getPeriodProgress(period: PlanningPeriod): number {
  return calculatePeriodProgress(period.objectives)
}
