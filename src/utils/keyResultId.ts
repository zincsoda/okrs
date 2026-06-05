import { v4 as uuidv4 } from 'uuid'
import type { KeyResult } from '../types'

const KEY_RESULT_ID_PATTERN = /^KR(\d+)$/i

/** Next sequential key result ID (KR1, KR2, …) within an objective. */
export function nextKeyResultId(keyResults: KeyResult[]): string {
  const max = keyResults.reduce((highest, keyResult) => {
    const match = keyResult.keyResultId?.match(KEY_RESULT_ID_PATTERN)
    if (!match) return highest
    return Math.max(highest, parseInt(match[1], 10))
  }, 0)

  return `KR${max + 1}`
}

/** Backfill missing UUIDs and human-readable key result IDs. */
export function normalizeKeyResults(keyResults: KeyResult[]): KeyResult[] {
  const usedIds = new Set<string>()
  const normalized: KeyResult[] = []

  for (const keyResult of keyResults) {
    let keyResultId = keyResult.keyResultId

    if (!keyResultId || usedIds.has(keyResultId)) {
      keyResultId = nextKeyResultId(normalized)
    }

    usedIds.add(keyResultId)
    normalized.push({
      ...keyResult,
      id: keyResult.id || uuidv4(),
      keyResultId,
    })
  }

  return normalized
}
