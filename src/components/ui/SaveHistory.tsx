import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchChangeEvents } from '../../api/changeEventsApi'
import { useOkrStore } from '../../store/okrStore'
import type { ChangeEvent } from '../../types/changeEvents'
import { formatChangeEventSummary, formatChangeEventTime } from '../../utils/changeEventLabels'

type SaveHistoryProps = {
  periodId: string
  limit?: number
}

export function SaveHistory({ periodId, limit = 15 }: SaveHistoryProps) {
  const [expanded, setExpanded] = useState(false)
  const [events, setEvents] = useState<ChangeEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isDirty = useOkrStore((s) => s.isDirty)
  const prevDirty = useRef(isDirty)

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchChangeEvents({ periodId, action: 'saved', limit })
      setEvents(rows)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load save history'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [periodId, limit])

  useEffect(() => {
    if (!expanded) return
    void loadEvents()
  }, [expanded, loadEvents])

  useEffect(() => {
    if (prevDirty.current && !isDirty && expanded) {
      void loadEvents()
    }
    prevDirty.current = isDirty
  }, [isDirty, expanded, loadEvents])

  return (
    <section className="card section-gap p-5">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="section-heading">Save history</h2>
          <p className="mt-1 text-sm text-slate-500">One entry per explicit save</p>
        </div>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {loading && <p className="text-sm text-slate-400">Loading save history…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-slate-400">No saves recorded yet.</p>
          )}
          {!loading && !error && events.length > 0 && (
            <ul className="space-y-3">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-slate-800">{event.userDisplay}</p>
                    <p className="text-xs text-slate-400">{formatChangeEventTime(event.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-slate-600">{formatChangeEventSummary(event)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
