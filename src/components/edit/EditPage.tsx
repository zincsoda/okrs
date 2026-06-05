import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOkrStore, useSelectedPeriod } from '../../store/okrStore'
import { isPeriodDraft, isPeriodEditable } from '../../store/selectors'
import { nextObjectiveId } from '../../utils/objectiveId'
import { validateObjectiveWeights } from '../../utils/validation'
import { UserMenu } from '../auth/UserMenu'
import { ObjectiveCard } from '../objective/ObjectiveCard'
import { ObjectiveFormModal } from '../objective/ObjectiveFormModal'
import { SaveControls } from '../ui/SaveControls'
import { SaveHistory } from '../ui/SaveHistory'

export function EditPage() {
  const period = useSelectedPeriod()
  const isDirty = useOkrStore((s) => s.isDirty)
  const expandedObjectives = useOkrStore((s) => s.expandedObjectives)
  const collapseAllObjectives = useOkrStore((s) => s.collapseAllObjectives)
  const addObjective = useOkrStore((s) => s.addObjective)
  const closePeriod = useOkrStore((s) => s.closePeriod)

  const [showObjectiveModal, setShowObjectiveModal] = useState(false)

  useEffect(() => {
    collapseAllObjectives()
    return () => collapseAllObjectives()
  }, [collapseAllObjectives])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  if (!period) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">No planning periods yet.</p>
      </div>
    )
  }

  const draft = isPeriodDraft(period)
  const editable = isPeriodEditable(period)
  const weightValidation = validateObjectiveWeights(period.objectives)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">Edit OKRs</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{period.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {period.startDate} → {period.endDate}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {editable && <SaveControls />}
            {editable && period.status === 'Active' && (
              <button
                type="button"
                onClick={() => closePeriod(period.id)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close period
              </button>
            )}
            <Link
              to="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
            >
              Back to dashboard
            </Link>
            <UserMenu />
          </div>
        </header>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Objectives</h2>
            {editable && draft && (
              <button
                type="button"
                onClick={() => setShowObjectiveModal(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                + Add objective
              </button>
            )}
          </div>

          {draft && period.objectives.length > 0 && !weightValidation.valid && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {weightValidation.errors.map((err) => (
                <p key={err}>{err}</p>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {period.objectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                period={period}
                expanded={expandedObjectives[objective.id] ?? false}
                interactive
              />
            ))}
          </div>

          {period.objectives.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
              <p className="text-slate-500">No objectives yet. Add your first objective to get started.</p>
              {editable && draft && (
                <button
                  type="button"
                  onClick={() => setShowObjectiveModal(true)}
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  + Add objective
                </button>
              )}
            </div>
          )}
        </section>

        <SaveHistory periodId={period.id} />

        <ObjectiveFormModal
          open={showObjectiveModal}
          onClose={() => setShowObjectiveModal(false)}
          title="Add Objective"
          suggestedObjectiveId={nextObjectiveId(period.objectives)}
          onSubmit={(data) => {
            addObjective(period.id, {
              objectiveId: data.objectiveId,
              title: data.title,
              description: data.description || undefined,
              owner: data.owner,
              weight: data.weight,
            })
          }}
        />
      </div>
    </div>
  )
}
