import type { ChangeAction, ChangeEvent, OkrEntityType } from '../types/changeEvents'

const fetchOptions: RequestInit = {
  credentials: 'include',
}

export async function fetchChangeEvents(options: {
  entityType?: OkrEntityType
  entityId?: string
  periodId?: string
  action?: ChangeAction
  limit?: number
}): Promise<ChangeEvent[]> {
  const params = new URLSearchParams()
  if (options.entityType) params.set('entityType', options.entityType)
  if (options.entityId) params.set('entityId', options.entityId)
  if (options.periodId) params.set('periodId', options.periodId)
  if (options.action) params.set('action', options.action)
  if (options.limit) params.set('limit', String(options.limit))

  const response = await fetch(`/api/change-events?${params.toString()}`, fetchOptions)
  if (!response.ok) {
    throw new Error(`Failed to load change history (${response.status})`)
  }

  const body = (await response.json()) as { events: ChangeEvent[] }
  return body.events
}
