import type { PlanningPeriod } from '../types'
import { getPeriodProgress } from '../utils/calculations'
import { getPeriodConfidence } from '../utils/confidence'
import { calculateObjectiveConfidence } from '../utils/confidence'
import { calculateObjectiveProgress } from '../utils/calculations'
import { calculateKrProgress } from '../utils/calculations'

export function selectActivePeriod(periods: PlanningPeriod[]): PlanningPeriod | undefined {
  return periods.find((p) => p.status === 'Active')
}

export function selectSelectedPeriod(
  periods: PlanningPeriod[],
  selectedPeriodId: string | null,
): PlanningPeriod | undefined {
  if (selectedPeriodId) {
    return periods.find((p) => p.id === selectedPeriodId)
  }
  return selectActivePeriod(periods) ?? periods[0]
}

export function selectPeriodProgress(period: PlanningPeriod | undefined): number {
  if (!period) return 0
  return getPeriodProgress(period)
}

export function selectPeriodConfidence(period: PlanningPeriod | undefined) {
  if (!period) return 'High' as const
  return getPeriodConfidence(period)
}

export function selectObjectiveProgress(objective: PlanningPeriod['objectives'][number]): number {
  return calculateObjectiveProgress(objective.keyResults)
}

export function selectObjectiveConfidence(objective: PlanningPeriod['objectives'][number]) {
  return calculateObjectiveConfidence(objective.keyResults)
}

export function selectKrProgress(kr: PlanningPeriod['objectives'][number]['keyResults'][number]): number {
  return calculateKrProgress(kr.baseline, kr.target, kr.current)
}

export function isPeriodEditable(period: PlanningPeriod | undefined): boolean {
  return period?.status !== 'Closed'
}

export function isPeriodDraft(period: PlanningPeriod | undefined): boolean {
  return period?.status === 'Draft'
}
