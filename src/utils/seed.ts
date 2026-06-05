import { v4 as uuidv4 } from 'uuid'
import type { KeyResult, PlanningPeriod } from '../types'
import { getDefaultQuarterDates, getDefaultQuarterName } from './quarterly'

export const O1_KEY_RESULT_TITLES = [
  'Build a labeled dataset of ≥50 representative 1-hour recordings across target environments',
  'Reduce pipeline configuration inputs to ≤10 interpretable environment parameters that predict optimal pipeline with <10% selection error rate for auditable metrics',
  'Achieve ≥90% correct pipeline selection across the 50-location dataset without manual CV intervention.',
  'Reduce internal pipeline audit and selection process from 15+ days → <2 days',
] as const

export const O2_KEY_RESULT_TITLES = [
  'Complete a comprehensive statistical audit to define baseline confidence intervals',
  'Define validation methodology with documented acceptable error thresholds that is efficient',
  'Replace absolute percentage metrics with visual confidence ranges across the dashboard.',
  'Achieve ≥X% classification stability within defined tolerance bands',
  'Define minimum sample size before demographic reporting is enabled',
] as const

export const O3_KEY_RESULT_TITLES = [
  'Source 8 more representative videos and acquire ground truth tracks with age and gender prediction for each one by July',
  'Calculate tracker level MAEP for each of the 8 videos by July using current model',
  'Tracker level MAEP from >16% to <5% for MTR004_20260319110626 without significant regression on other benchmark metrics',
  'Tracker level MAEP from >11% to <5% for SVC-05-20260303-Day-Acam-DZOOM without significant regression on other benchmark metrics',
] as const

function createKeyResult(title: string, keyResultId: string, weight: number): KeyResult {
  return {
    id: uuidv4(),
    keyResultId,
    title,
    owner: 'Technology Team',
    baseline: 0,
    target: 1,
    current: 0,
    weight,
    confidence: 'Medium',
  }
}

/** Key results for objective O1. */
export function createO1KeyResults(): KeyResult[] {
  const weight = 1 / O1_KEY_RESULT_TITLES.length
  return O1_KEY_RESULT_TITLES.map((title, index) =>
    createKeyResult(title, `KR${index + 1}`, weight),
  )
}

/** Key results for objective O2. */
export function createO2KeyResults(): KeyResult[] {
  const weight = 1 / O2_KEY_RESULT_TITLES.length
  return O2_KEY_RESULT_TITLES.map((title, index) =>
    createKeyResult(title, `KR${index + 1}`, weight),
  )
}

/** Key results for objective O3. */
export function createO3KeyResults(): KeyResult[] {
  const weight = 1 / O3_KEY_RESULT_TITLES.length
  return O3_KEY_RESULT_TITLES.map((title, index) =>
    createKeyResult(title, `KR${index + 1}`, weight),
  )
}

/** Minimal example seed — one draft period with O1, O2, and O3 objectives. */
export function createSeedPeriod(): PlanningPeriod {
  const { startDate, endDate } = getDefaultQuarterDates()

  return {
    id: uuidv4(),
    name: getDefaultQuarterName(),
    startDate,
    endDate,
    status: 'Draft',
    objectives: [
      {
        id: uuidv4(),
        objectiveId: 'O1',
        title: 'Improve platform reliability',
        description: 'Reduce incidents and improve uptime across core services.',
        owner: 'Engineering Lead',
        weight: 1 / 3,
        status: 'Draft',
        keyResults: createO1KeyResults(),
      },
      {
        id: uuidv4(),
        objectiveId: 'O2',
        title: 'Strengthen statistical validation and reporting confidence',
        description:
          'Establish baseline confidence intervals, validation methodology, and dashboard metrics that reflect uncertainty accurately.',
        owner: 'Engineering Lead',
        weight: 1 / 3,
        status: 'Draft',
        keyResults: createO2KeyResults(),
      },
      {
        id: uuidv4(),
        objectiveId: 'O3',
        title: 'Improve tracker accuracy on benchmark videos',
        description:
          'Expand the benchmark dataset and reduce tracker-level MAEP on priority videos without regressing other metrics.',
        owner: 'Engineering Lead',
        weight: 1 / 3,
        status: 'Draft',
        keyResults: createO3KeyResults(),
      },
    ],
  }
}

function isObjectiveWithId(objectiveId: string, number: number): boolean {
  const normalized = objectiveId.trim().toUpperCase()
  const id = `O${number}`
  const padded = String(number).padStart(2, '0')
  return normalized === id || normalized === padded || normalized === String(number)
}

export function isObjectiveO1(objectiveId: string): boolean {
  return isObjectiveWithId(objectiveId, 1)
}

export function isObjectiveO2(objectiveId: string): boolean {
  return isObjectiveWithId(objectiveId, 2)
}

export function isObjectiveO3(objectiveId: string): boolean {
  return isObjectiveWithId(objectiveId, 3)
}

function mergeCanonicalKeyResults(
  keyResults: KeyResult[],
  titles: readonly string[],
  weight: number,
): KeyResult[] {
  const byTitle = new Map(keyResults.map((kr) => [kr.title, kr]))

  return titles.map((title, index) => {
    const existing = byTitle.get(title)
    if (existing) {
      return { ...existing, weight, keyResultId: `KR${index + 1}` }
    }
    return createKeyResult(title, `KR${index + 1}`, weight)
  })
}

/** Sync O1 key results to the canonical set, preserving progress on matching titles. */
export function mergeO1KeyResults(keyResults: KeyResult[]): KeyResult[] {
  return mergeCanonicalKeyResults(keyResults, O1_KEY_RESULT_TITLES, 1 / O1_KEY_RESULT_TITLES.length)
}

/** Sync O2 key results to the canonical set, preserving progress on matching titles. */
export function mergeO2KeyResults(keyResults: KeyResult[]): KeyResult[] {
  return mergeCanonicalKeyResults(keyResults, O2_KEY_RESULT_TITLES, 1 / O2_KEY_RESULT_TITLES.length)
}

/** Sync O3 key results to the canonical set, preserving progress on matching titles. */
export function mergeO3KeyResults(keyResults: KeyResult[]): KeyResult[] {
  return mergeCanonicalKeyResults(keyResults, O3_KEY_RESULT_TITLES, 1 / O3_KEY_RESULT_TITLES.length)
}
