import { describe, expect, it } from 'vitest'
import { renumberKeyResults } from './keyResultId'
import type { KeyResult } from '../types'

function makeKeyResult(keyResultId: string): KeyResult {
  return {
    id: `id-${keyResultId}`,
    keyResultId,
    title: keyResultId,
    owner: 'Owner',
    baseline: 0,
    target: 100,
    current: 0,
    weight: 0.5,
    confidence: 'High',
  }
}

describe('renumberKeyResults', () => {
  it('assigns KR labels to match position', () => {
    const keyResults = [makeKeyResult('KR3'), makeKeyResult('KR1'), makeKeyResult('KR2')]

    expect(renumberKeyResults(keyResults).map((kr) => kr.keyResultId)).toEqual(['KR1', 'KR2', 'KR3'])
  })

  it('preserves other fields', () => {
    const keyResults = [makeKeyResult('KR9')]

    const [renumbered] = renumberKeyResults(keyResults)

    expect(renumbered.id).toBe('id-KR9')
    expect(renumbered.title).toBe('KR9')
  })
})
