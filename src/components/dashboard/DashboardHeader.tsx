import { Link } from 'react-router-dom'
import type { PlanningPeriod } from '../../types'
import { useAuthStore } from '../../store/authStore'
import { useOkrStore } from '../../store/okrStore'
import { selectPeriodConfidence, selectPeriodProgress } from '../../store/selectors'
import { progressToPercent, getProgressTextColorClass } from '../../utils/calculations'
import { formatPeriodRange } from '../../utils/formatDate'
import { UserMenu } from '../auth/UserMenu'
import { PageHeader } from '../layout/PageHeader'
import { PeriodSelector } from '../period/PeriodSelector'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { ProgressBar } from '../ui/ProgressBar'
import { StatusBadge } from '../ui/StatusBadge'

type DashboardHeaderProps = {
  period: PlanningPeriod
}

export function DashboardHeader({ period }: DashboardHeaderProps) {
  const canAccess = useAuthStore((s) => s.canAccess)
  const periods = useOkrStore((s) => s.periods)
  const selectedPeriodId = useOkrStore((s) => s.selectedPeriodId)
  const selectPeriod = useOkrStore((s) => s.selectPeriod)
  const progress = selectPeriodProgress(period)
  const confidence = selectPeriodConfidence(period)
  const percent = progressToPercent(progress)

  const displayPeriodId = selectedPeriodId ?? period.id

  return (
    <PageHeader
      eyebrow="SRT Tech Team OKRs"
      title={period.name}
      badges={<StatusBadge status={period.status} />}
      subtitle={formatPeriodRange(period.startDate, period.endDate)}
      actions={
        <>
          {canAccess('editor') && (
            <Link to="/edit" className="btn-accent">
              Edit OKRs
            </Link>
          )}
          {canAccess('admin') && (
            <Link to="/admin" className="btn-secondary">
              Admin
            </Link>
          )}
          <UserMenu />
        </>
      }
    >
      {canAccess('editor') && periods.length > 1 && (
        <div className="mb-6 max-w-sm">
          <label htmlFor="dashboard-period" className="form-label">
            Planning period
          </label>
          <PeriodSelector
            id="dashboard-period"
            periods={periods}
            selectedId={displayPeriodId}
            onSelect={selectPeriod}
          />
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
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
    </PageHeader>
  )
}
