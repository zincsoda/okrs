import type { PlanningPeriod } from '../types'

export type RemoteOkrState = {
  periods: PlanningPeriod[]
  selectedPeriodId: string | null
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
): Promise<void> {
  const response = await fetch('/api/state', {
    ...fetchOptions,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...state,
      recordSave: options?.recordSave ?? false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to save OKRs (${response.status})`)
  }
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
