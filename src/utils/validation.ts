import type { Objective, PlanningPeriod, ValidationResult } from '../types'

const WEIGHT_TOLERANCE = 0.001

export function sumWeights(weights: number[]): number {
  return weights.reduce((sum, w) => sum + w, 0)
}

export function isWeightSumValid(weights: number[]): boolean {
  if (weights.length === 0) return false
  return Math.abs(sumWeights(weights) - 1) < WEIGHT_TOLERANCE
}

export function validateObjectiveWeights(objectives: Objective[]): ValidationResult {
  const errors: string[] = []

  if (objectives.length === 0) {
    errors.push('At least one objective is required before activation.')
    return { valid: false, errors }
  }

  const total = sumWeights(objectives.map((o) => o.weight))
  if (!isWeightSumValid(objectives.map((o) => o.weight))) {
    errors.push(
      `Objective weights must sum to 100% (currently ${Math.round(total * 100)}%).`,
    )
  }

  return { valid: errors.length === 0, errors }
}

export function validateKeyResultWeights(objective: Objective): ValidationResult {
  const errors: string[] = []
  const { keyResults } = objective

  if (keyResults.length === 0) {
    errors.push('At least one key result is required before objective activation.')
    return { valid: false, errors }
  }

  const total = sumWeights(keyResults.map((kr) => kr.weight))
  if (!isWeightSumValid(keyResults.map((kr) => kr.weight))) {
    errors.push(
      `Key result weights must sum to 100% (currently ${Math.round(total * 100)}%).`,
    )
  }

  return { valid: errors.length === 0, errors }
}

export function validatePeriodActivation(period: PlanningPeriod): ValidationResult {
  const objectiveValidation = validateObjectiveWeights(period.objectives)
  const krErrors: string[] = []

  for (const objective of period.objectives) {
    const krValidation = validateKeyResultWeights(objective)
    if (!krValidation.valid) {
      krErrors.push(`"${objective.title}": ${krValidation.errors.join(' ')}`)
    }
  }

  return {
    valid: objectiveValidation.valid && krErrors.length === 0,
    errors: [...objectiveValidation.errors, ...krErrors],
  }
}
