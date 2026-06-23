import { describe, expect, it } from 'vitest'
import type { PlanningPeriod } from '../types'
import { formatLocalChangesForClipboard } from './formatLocalChanges'

const basePeriod: PlanningPeriod = {
  id: 'period-1',
  name: '2026 Q2',
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  status: 'Draft',
  objectives: [
    {
      id: 'obj-1',
      objectiveId: 'O1',
      title: 'Improve reliability',
      owner: 'Alex',
      weight: 1,
      status: 'Draft',
      keyResults: [
        {
          id: 'kr-1',
          keyResultId: 'O1.1',
          title: 'Reduce incidents',
          owner: 'Alex',
          baseline: 0,
          target: 10,
          current: 2,
          weight: 1,
          confidence: 'Medium',
        },
      ],
    },
  ],
}

describe('formatLocalChangesForClipboard', () => {
  it('lists field updates, additions, and removals', () => {
    const localPeriod: PlanningPeriod = {
      ...basePeriod,
      objectives: [
        {
          ...basePeriod.objectives[0],
          title: 'Improve platform reliability',
          keyResults: [
            {
              ...basePeriod.objectives[0].keyResults[0],
              current: 4,
            },
            {
              id: 'kr-2',
              keyResultId: 'O1.2',
              title: 'Launch monitoring',
              owner: 'Sam',
              baseline: 0,
              target: 1,
              current: 0,
              weight: 0.5,
              confidence: 'High',
            },
          ],
        },
      ],
    }

    const text = formatLocalChangesForClipboard({
      serverPeriods: [basePeriod],
      localPeriods: [localPeriod],
      serverSelectedPeriodId: 'period-1',
      localSelectedPeriodId: 'period-1',
    })

    expect(text).toContain('Unsaved OKR changes')
    expect(text).toContain('O1: Improve platform reliability: title "Improve reliability" → "Improve platform reliability"')
    expect(text).toContain('O1.1: Reduce incidents: current "2" → "4"')
    expect(text).toContain('Added O1.2: Launch monitoring')
  })

  it('reports when there are no differences', () => {
    const text = formatLocalChangesForClipboard({
      serverPeriods: [basePeriod],
      localPeriods: [basePeriod],
      serverSelectedPeriodId: 'period-1',
      localSelectedPeriodId: 'period-1',
    })

    expect(text).toContain('No differences found between your edits and the server.')
  })
})
