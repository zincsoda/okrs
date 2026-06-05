import { Link } from 'react-router-dom'
import type { PlanningPeriod } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { selectPeriodConfidence, selectPeriodProgress } from '../../store/selectors'
import { progressToPercent, getProgressTextColorClass } from '../../utils/calculations'
import { UserMenu } from '../auth/UserMenu'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { ProgressBar } from '../ui/ProgressBar'

type DashboardHeaderProps = {
  period: PlanningPeriod
}

export function DashboardHeader({ period }: DashboardHeaderProps) {
  const canAccess = useAuthStore((s) => s.canAccess)
  const progress = selectPeriodProgress(period)
  const confidence = selectPeriodConfidence(period)
  const percent = progressToPercent(progress)

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-sm font-medium uppercase tracking-wide text-indigo-600">
            SRT Tech Team OKRs
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canAccess('editor') && (
            <Link
              to="/edit"
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-100"
            >
              Edit OKRs
            </Link>
          )}
          {canAccess('admin') && (
            <Link
              to="/admin"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
            >
              Admin
            </Link>
          )}
          <UserMenu />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{period.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {period.startDate} → {period.endDate}
          </p>
        </div>

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
    </header>
  )
}
