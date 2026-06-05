import type { Confidence, KeyResult, Objective, PlanningPeriod } from '../types'

const CONFIDENCE_RANK: Record<Confidence, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
}

/** Objective confidence derived from KR confidence and weights. */
export function calculateObjectiveConfidence(keyResults: KeyResult[]): Confidence {
  if (keyResults.length === 0) return 'High'

  const hasLowWeighted = keyResults.some(
    (kr) => kr.weight >= 0.3 && kr.confidence === 'Low',
  )
  if (hasLowWeighted) return 'Low'

  const hasMedium = keyResults.some((kr) => kr.confidence === 'Medium')
  if (hasMedium) return 'Medium'

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
