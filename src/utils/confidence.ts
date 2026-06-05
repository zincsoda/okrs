import type { Confidence, KeyResult, Objective, PlanningPeriod } from '../types'

const CONFIDENCE_RANK: Record<Confidence, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
}

const SIGNIFICANT_WEIGHT = 0.3

function combinedWeight(keyResults: KeyResult[], confidence: Confidence): number {
  return keyResults
    .filter((kr) => kr.confidence === confidence)
    .reduce((sum, kr) => sum + kr.weight, 0)
}

/**
 * Objective confidence uses weighted-lowest logic: walk Low → Medium → High and
 * return the first tier whose key results collectively account for ≥30% weight.
 */
export function calculateObjectiveConfidence(keyResults: KeyResult[]): Confidence {
  if (keyResults.length === 0) return 'High'

  if (combinedWeight(keyResults, 'Low') >= SIGNIFICANT_WEIGHT) return 'Low'
  if (combinedWeight(keyResults, 'Medium') >= SIGNIFICANT_WEIGHT) return 'Medium'
  if (combinedWeight(keyResults, 'High') >= SIGNIFICANT_WEIGHT) return 'High'

  return 'High'
}

/** Period confidence: lowest confidence among objectives weighted ≥ 0.25. */
export function calculatePeriodConfidence(objectives: Objective[]): Confidence {
  const significant = objectives.filter((obj) => obj.weight >= 0.25)

  if (significant.length === 0) return 'High'

  return significant.reduce<Confidence>((lowest, obj) => {
    const objConfidence = calculateObjectiveConfidence(obj.keyResults)
    return CONFIDENCE_RANK[objConfidence] < CONFIDENCE_RANK[lowest]
      ? objConfidence
      : lowest
  }, 'High')
}

export function getConfidenceBadgeClasses(confidence: Confidence): string {
  switch (confidence) {
    case 'High':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
    case 'Medium':
      return 'bg-amber-100 text-amber-800 ring-amber-200'
    case 'Low':
      return 'bg-red-100 text-red-800 ring-red-200'
  }
}

export function getPeriodConfidence(period: PlanningPeriod): Confidence {
  return calculatePeriodConfidence(period.objectives)
}
