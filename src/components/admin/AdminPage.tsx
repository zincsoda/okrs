import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOkrStore } from '../../store/okrStore'
import { selectActivePeriod } from '../../store/selectors'
import { UserMenu } from '../auth/UserMenu'
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">Admin</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Administration</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage user accounts and planning periods for the OKR dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SaveControls />
            <Link
              to="/"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
            <UserMenu />
          </div>
        </header>

        <div className="mb-8">
          <UserManagement />
        </div>

        {periods.length > 0 && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
            <h2 className="text-sm font-semibold text-slate-900">All periods</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                New period
              </button>
              {nextPeriodSource && (
                <button
                  type="button"
                  onClick={handleSetUpNextPeriod}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                >
                  Set up next period
                </button>
              )}
            </div>
          </div>

          <PeriodList />
        </section>

        {displayPeriodId && <SaveHistory periodId={displayPeriodId} />}
      </div>

      <CreatePeriodModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(name, startDate, endDate) => createPeriod(name, startDate, endDate)}
      />
    </div>
  )
}
