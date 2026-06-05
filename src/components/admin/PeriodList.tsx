import { useEffect, useRef, useState } from 'react'
import type { PeriodStatus, PlanningPeriod } from '../../types'
import { useOkrStore } from '../../store/okrStore'
import { validatePeriodActivation } from '../../utils/validation'

const PERIOD_STATUSES: PeriodStatus[] = ['Draft', 'Active', 'Closed']

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100'

type PeriodRowMenuProps = {
  onDuplicate: () => void
  onDelete: () => void
}

function PeriodRowMenu({ onDuplicate, onDelete }: PeriodRowMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Period actions"
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-200"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDuplicate()
              setOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Duplicate
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDelete()
              setOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

type PeriodRowProps = {
  period: PlanningPeriod
  onDuplicate: () => void
  onDelete: () => void
}

function PeriodRow({ period, onDuplicate, onDelete }: PeriodRowProps) {
  const updatePeriod = useOkrStore((s) => s.updatePeriod)
  const setPeriodStatus = useOkrStore((s) => s.setPeriodStatus)
  const [statusErrors, setStatusErrors] = useState<string[]>([])

  const validation = validatePeriodActivation(period)
  const showActivationHint = period.status === 'Draft' && !validation.valid

  const handleStatusChange = (status: PeriodStatus) => {
    if (status === period.status) return
    const result = setPeriodStatus(period.id, status)
    setStatusErrors(result.success ? [] : result.errors)
  }

  return (
    <div className="border-b border-slate-100 px-4 py-4 last:border-b-0">
      <div className="grid gap-3 sm:grid-cols-12 sm:items-start">
        <div className="sm:col-span-4">
          <label className="mb-1 block text-xs font-medium text-slate-500 sm:sr-only">Name</label>
          <input
            type="text"
            value={period.name}
            onChange={(e) => updatePeriod(period.id, { name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:col-span-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 sm:sr-only">Start</label>
            <input
              type="date"
              value={period.startDate}
              onChange={(e) => updatePeriod(period.id, { startDate: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 sm:sr-only">End</label>
            <input
              type="date"
              value={period.endDate}
              onChange={(e) => updatePeriod(period.id, { endDate: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex items-end gap-2 sm:col-span-4">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500 sm:sr-only">Status</label>
            <select
              value={period.status}
              onChange={(e) => handleStatusChange(e.target.value as PeriodStatus)}
              className={inputClass}
            >
              {PERIOD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <PeriodRowMenu onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      </div>

      {(statusErrors.length > 0 || showActivationHint) && (
        <div className="mt-3 space-y-1 text-sm">
          {statusErrors.map((err) => (
            <p key={err} className="text-red-700">
              {err}
            </p>
          ))}
          {showActivationHint &&
            validation.errors.map((err) => (
              <p key={err} className="text-amber-700">
                {err}
              </p>
            ))}
        </div>
      )}
    </div>
  )
}

export function PeriodList() {
  const periods = useOkrStore((s) => s.periods)
  const duplicatePeriod = useOkrStore((s) => s.duplicatePeriod)
  const deletePeriod = useOkrStore((s) => s.deletePeriod)

  const handleDelete = (period: PlanningPeriod) => {
    const message =
      period.status === 'Active'
        ? `Delete active period "${period.name}"? The dashboard will switch to another period.`
        : `Delete period "${period.name}"? This cannot be undone.`
    if (!window.confirm(message)) return
    deletePeriod(period.id)
  }

  const sorted = [...periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )

  if (sorted.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">
        No planning periods yet. Create one to get started.
      </p>
    )
  }

  return (
    <div>
      <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-12 sm:gap-3">
        <div className="sm:col-span-4">Name</div>
        <div className="sm:col-span-2">Start</div>
        <div className="sm:col-span-2">End</div>
        <div className="sm:col-span-2">Status</div>
        <div className="sm:col-span-2" />
      </div>
      {sorted.map((period) => (
        <PeriodRow
          key={period.id}
          period={period}
          onDuplicate={() => duplicatePeriod(period.id)}
          onDelete={() => handleDelete(period)}
        />
      ))}
    </div>
  )
}
