import type { PlanningPeriod } from '../types'

export type RemoteOkrState = {
  periods: PlanningPeriod[]
  selectedPeriodId: string | null
  version: number
}

export class SaveConflictError extends Error {
  readonly serverState: RemoteOkrState

  constructor(serverState: RemoteOkrState) {
    super('Someone else saved changes while you were editing.')
    this.name = 'SaveConflictError'
    this.serverState = serverState
  }
}

export function normalizeStateVersion(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const version = Math.trunc(value)
    return version > 0 ? version : 1
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const version = Number.parseInt(value, 10)
    return version > 0 ? version : 1
  }

  return 1
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    if (body.error?.trim()) {
      return body.error
    }
  } catch {
    // Ignore malformed error bodies.
  }

  return fallback
}

const fetchOptions: RequestInit = {
  credentials: 'include',
}

export async function fetchOkrState(): Promise<RemoteOkrState> {
  const response = await fetch('/api/state', fetchOptions)
  if (!response.ok) {
    throw new Error(`Failed to load OKRs (${response.status})`)
  }

  const remote = (await response.json()) as RemoteOkrState

  return {
    ...remote,
    version: normalizeStateVersion(remote.version),
  }
}

export async function saveOkrState(
  state: RemoteOkrState,
  options?: { recordSave?: boolean },
): Promise<{ version: number }> {
  const response = await fetch('/api/state', {
    ...fetchOptions,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periods: state.periods,
      selectedPeriodId: state.selectedPeriodId,
      expectedVersion: normalizeStateVersion(state.version),
      recordSave: options?.recordSave ?? false,
    }),
  })

  if (response.status === 409) {
    const serverState = (await response.json()) as RemoteOkrState
    throw new SaveConflictError({
      ...serverState,
      version: normalizeStateVersion(serverState.version),
    })
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Failed to save OKRs (${response.status})`))
  }

  const result = (await response.json()) as { success: boolean; version: number }
  return { version: normalizeStateVersion(result.version) }
}

export async function saveSelectedPeriod(selectedPeriodId: string | null): Promise<void> {
  const response = await fetch('/api/settings', {
    ...fetchOptions,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedPeriodId }),
  })

  if (!response.ok) {
    throw new Error(`Failed to save settings (${response.status})`)
  }
}
