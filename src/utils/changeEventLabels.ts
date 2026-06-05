import type { ChangeEvent } from '../types/changeEvents'

export function formatChangeEventSummary(event: ChangeEvent): string {
  if (event.action === 'saved') {
    return event.newValue ?? 'Saved changes'
  }
  if (event.action === 'created') {
    return 'Added'
  }
  if (event.action === 'deleted') {
    return 'Removed'
  }

  return 'Updated'
}

export function formatChangeEventTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
