import { v4 as uuidv4 } from 'uuid'
import type { Objective, PlanningPeriod } from '../types'
import { normalizeKeyResults } from './keyResultId'
import {
  isObjectiveO1,
  isObjectiveO2,
  isObjectiveO3,
  mergeO1KeyResults,
  mergeO2KeyResults,
  mergeO3KeyResults,
} from './seed'

const OBJECTIVE_ID_PATTERN = /^O(\d+)$/i

/** Next sequential objective ID (O1, O2, …) for a period. */
export function nextObjectiveId(objectives: Objective[]): string {
  const max = objectives.reduce((highest, objective) => {
    const match = objective.objectiveId?.match(OBJECTIVE_ID_PATTERN)
    if (!match) return highest
    return Math.max(highest, parseInt(match[1], 10))
  }, 0)

  return `O${max + 1}`
}

function normalizePeriodObjectives(objectives: Objective[]): Objective[] {
  const usedIds = new Set<string>()
  const normalized: Objective[] = []

  for (const objective of objectives) {
    let objectiveId = objective.objectiveId

    if (!objectiveId || usedIds.has(objectiveId)) {
      objectiveId = nextObjectiveId(normalized)
    }

    usedIds.add(objectiveId)
    let keyResults = normalizeKeyResults(objective.keyResults)
    if (isObjectiveO1(objectiveId)) {
      keyResults = normalizeKeyResults(mergeO1KeyResults(keyResults))
    } else if (isObjectiveO2(objectiveId)) {
      keyResults = normalizeKeyResults(mergeO2KeyResults(keyResults))
    } else if (isObjectiveO3(objectiveId)) {
      keyResults = normalizeKeyResults(mergeO3KeyResults(keyResults))
    }
    normalized.push({
      ...objective,
      id: objective.id || uuidv4(),
      objectiveId,
      keyResults,
    })
  }

  return normalized
}

/** Backfill missing UUIDs and human-readable objective IDs across persisted data. */
export function normalizePeriods(periods: PlanningPeriod[]): PlanningPeriod[] {
  return periods.map((period) => ({
    ...period,
    id: period.id || uuidv4(),
    objectives: normalizePeriodObjectives(period.objectives),
  }))
}
