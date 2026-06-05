import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOkrStore } from '../../store/okrStore'
import { selectActivePeriod } from '../../store/selectors'
import { UserMenu } from '../auth/UserMenu'
import { PageShell } from '../layout/PageShell'
import { PageHeader } from '../layout/PageHeader'
import { CreatePeriodModal } from '../period/CreatePeriodModal'
import { PeriodSelector } from '../period/PeriodSelector'
import { PeriodList } from './PeriodList'
import { UserManagement } from './UserManagement'
import { SaveControls } from '../ui/SaveControls'
import { SaveHistory } from '../ui/SaveHistory'

export function AdminPage() {
  const periods = useOkrStore((s) => s.periods)
  const selectedPeriodId = useOkrStore((s) => s.selectedPeriodId)
  const selectPeriod = useOkrStore((s) => s.selectPeriod)
  const createPeriod = useOkrStore((s) => s.createPeriod)
  const createNextPeriod = useOkrStore((s) => s.createNextPeriod)

  const [showCreateModal, setShowCreateModal] = useState(false)

  const nextPeriodSource = useMemo(() => {
    const active = selectActivePeriod(periods)
    if (active) return active
    const sorted = [...periods].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
    return sorted[0]
  }, [periods])

  const handleSetUpNextPeriod = () => {
    if (!nextPeriodSource) return
    createNextPeriod(nextPeriodSource.id, { removePlaceholderKeyResults: true })
  }

  const displayPeriodId = useMemo(() => {
    if (selectedPeriodId && periods.some((period) => period.id === selectedPeriodId)) {
      return selectedPeriodId
    }
    const active = selectActivePeriod(periods)
    if (active) return active.id
    const sorted = [...periods].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
    return sorted[0]?.id ?? null
  }, [periods, selectedPeriodId])

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin"
        title="Administration"
        subtitle="Manage user accounts and planning periods for the OKR dashboard."
        actions={
          <>
            <SaveControls />
            <Link to="/" className="btn-secondary">
              Back to dashboard
            </Link>
            <UserMenu />
          </>
        }
      />

      <div className="section-gap">
        <UserManagement />
      </div>

      {periods.length > 0 && (
        <section className="card section-gap p-6">
          <h2 className="text-sm font-semibold text-slate-900">Dashboard display</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select which planning period visitors see on the main OKR page.
          </p>
          <div className="mt-4 max-w-md">
            <PeriodSelector
              periods={periods}
              selectedId={displayPeriodId}
              onSelect={selectPeriod}
            />
          </div>
        </section>
      )}

      <section className="card section-gap">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
          <h2 className="text-sm font-semibold text-slate-900">All periods</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-secondary btn-sm"
            >
              New period
            </button>
            {nextPeriodSource && (
              <button
                type="button"
                onClick={handleSetUpNextPeriod}
                className="btn-accent btn-sm"
              >
                Set up next period
              </button>
            )}
          </div>
        </div>

        <PeriodList />
      </section>

      {displayPeriodId && <SaveHistory periodId={displayPeriodId} />}

      <CreatePeriodModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(name, startDate, endDate) => createPeriod(name, startDate, endDate)}
      />
    </PageShell>
  )
}
