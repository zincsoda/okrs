import { describe, expect, it } from 'vitest'
import { normalizeStateVersion } from '../api/okrApi'

describe('normalizeStateVersion', () => {
  it('defaults missing or invalid values to 1', () => {
    expect(normalizeStateVersion(undefined)).toBe(1)
    expect(normalizeStateVersion(null)).toBe(1)
    expect(normalizeStateVersion('')).toBe(1)
    expect(normalizeStateVersion('abc')).toBe(1)
    expect(normalizeStateVersion(0)).toBe(1)
  })

  it('normalizes valid numbers and numeric strings', () => {
    expect(normalizeStateVersion(3)).toBe(3)
    expect(normalizeStateVersion('4')).toBe(4)
    expect(normalizeStateVersion(5.9)).toBe(5)
  })
})
