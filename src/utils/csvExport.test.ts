import { describe, expect, it } from 'vitest'
import type { PlanningPeriod } from '../types'
import { buildOkrCsv, buildOkrCsvFilename, escapeCsvField } from './csvExport'

const samplePeriod: PlanningPeriod = {
  id: 'period-1',
  name: 'Q2 2026',
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  status: 'Active',
  objectives: [
    {
      id: 'obj-1',
      objectiveId: 'O1',
      title: 'Improve reliability',
      description: 'Keep the platform stable',
      owner: 'Alice',
      weight: 0.4,
      status: 'Active',
      keyResults: [
        {
          id: 'kr-1',
          keyResultId: 'O1-KR1',
          title: 'Reduce incidents',
          owner: 'Bob',
          baseline: 10,
          target: 2,
          current: 6,
          weight: 0.5,
          confidence: 'Medium',
          notes: 'Trending down',
        },
      ],
    },
    {
      id: 'obj-2',
      objectiveId: 'O2',
      title: 'Ship "Alpha, Beta" release',
      owner: 'Carol',
      weight: 0.6,
      status: 'Draft',
      keyResults: [],
    },
  ],
}

describe('escapeCsvField', () => {
  it('quotes values containing commas or quotes', () => {
    expect(escapeCsvField('Hello, world')).toBe('"Hello, world"')
    expect(escapeCsvField('Say "hello"')).toBe('"Say ""hello"""')
  })
})

describe('buildOkrCsv', () => {
  it('includes one row per key result and handles objectives without key results', () => {
    const csv = buildOkrCsv([samplePeriod])
    const lines = csv.split('\n')

    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('Period Name')
    expect(lines[1]).toContain('Q2 2026')
    expect(lines[1]).toContain('O1-KR1')
    expect(lines[1]).toContain('Trending down')
    expect(lines[2]).toContain('O2')
    expect(lines[2]).toContain('"Ship ""Alpha, Beta"" release"')
    expect(lines[2].endsWith(',,,,,,,,,')).toBe(true)
  })
})

describe('buildOkrCsvFilename', () => {
  it('uses the period name for a single export', () => {
    expect(buildOkrCsvFilename([samplePeriod])).toMatch(/^okrs-q2-2026-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  it('uses an all-periods prefix for multi-period exports', () => {
    expect(buildOkrCsvFilename([samplePeriod, { ...samplePeriod, id: 'period-2' }])).toMatch(
      /^okrs-all-periods-\d{4}-\d{2}-\d{2}\.csv$/,
    )
  })
})
