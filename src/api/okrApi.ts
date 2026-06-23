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

const fetchOptions: RequestInit = {
  credentials: 'include',
}

export async function fetchOkrState(): Promise<RemoteOkrState> {
  const response = await fetch('/api/state', fetchOptions)
  if (!response.ok) {
    throw new Error(`Failed to load OKRs (${response.status})`)
  }

  return response.json() as Promise<RemoteOkrState>
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
      expectedVersion: state.version,
      recordSave: options?.recordSave ?? false,
    }),
  })

  if (response.status === 409) {
    const serverState = (await response.json()) as RemoteOkrState
    throw new SaveConflictError(serverState)
  }

  if (!response.ok) {
    throw new Error(`Failed to save OKRs (${response.status})`)
  }

  const result = (await response.json()) as { success: boolean; version: number }
  return { version: result.version }
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
