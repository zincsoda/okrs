import { useState } from 'react'
import type { PlanningPeriod } from '../../types'
import { useOkrStore } from '../../store/okrStore'
import { selectPeriodConfidence, selectPeriodProgress, isPeriodDraft } from '../../store/selectors'
import { progressToPercent, getProgressTextColorClass } from '../../utils/calculations'
import { validatePeriodActivation } from '../../utils/validation'
import { PeriodSelector, PeriodStatusDisplay } from '../period/PeriodSelector'
import { CreatePeriodModal } from '../period/CreatePeriodModal'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { ProgressBar } from '../ui/ProgressBar'

type DashboardHeaderProps = {
  period: PlanningPeriod
  periods: PlanningPeriod[]
}

export function DashboardHeader({ period, periods }: DashboardHeaderProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activationErrors, setActivationErrors] = useState<string[]>([])

  const selectedPeriodId = useOkrStore((s) => s.selectedPeriodId)
  const executiveMode = useOkrStore((s) => s.executiveMode)
  const selectPeriod = useOkrStore((s) => s.selectPeriod)
  const toggleExecutiveMode = useOkrStore((s) => s.toggleExecutiveMode)
  const createPeriod = useOkrStore((s) => s.createPeriod)
  const activatePeriod = useOkrStore((s) => s.activatePeriod)
  const closePeriod = useOkrStore((s) => s.closePeriod)
  const duplicatePeriod = useOkrStore((s) => s.duplicatePeriod)

  const progress = selectPeriodProgress(period)
  const confidence = selectPeriodConfidence(period)
  const percent = progressToPercent(progress)
  const draft = isPeriodDraft(period)
  const validation = validatePeriodActivation(period)

  const handleActivate = () => {
    const result = activatePeriod(period.id)
    setActivationErrors(result.errors)
  }

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-sm font-medium uppercase tracking-wide text-indigo-600">
            SRT Tech Team OKRs
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition hover:border-indigo-200">
            <input
              type="checkbox"
              checked={executiveMode}
              onChange={toggleExecutiveMode}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-700">Executive mode</span>
          </label>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector
              periods={periods}
              selectedId={selectedPeriodId ?? period.id}
              onSelect={selectPeriod}
            />
            <PeriodStatusDisplay status={period.status} />
            <span className="text-sm text-slate-500">
              {period.startDate} → {period.endDate}
            </span>
          </div>

          {!executiveMode && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                New period
              </button>
              <button
                type="button"
                onClick={() => duplicatePeriod(period.id)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Duplicate
              </button>
              {draft && (
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={!validation.valid}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Activate period
                </button>
              )}
              {period.status === 'Active' && (
                <button
                  type="button"
                  onClick={() => closePeriod(period.id)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Close period
                </button>
              )}
            </div>
          )}
        </div>

        {activationErrors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {activationErrors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        {draft && !validation.valid && !executiveMode && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {validation.errors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Overall progress</span>
              <span className={`text-2xl font-bold tabular-nums ${getProgressTextColorClass(percent)}`}>
                {percent}%
              </span>
            </div>
            <ProgressBar progress={progress} showLabel={false} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">Overall confidence</span>
            <ConfidenceBadge confidence={confidence} />
          </div>
        </div>
      </div>

      <CreatePeriodModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(name, start, end) => createPeriod(name, start, end)}
      />
    </header>
  )
}
