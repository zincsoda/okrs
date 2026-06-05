import { useState } from 'react'
import { useOkrStore, useSelectedPeriod } from '../../store/okrStore'
import { isPeriodDraft, isPeriodEditable } from '../../store/selectors'
import { nextObjectiveId } from '../../utils/objectiveId'
import { validateObjectiveWeights } from '../../utils/validation'
import { DashboardHeader } from './DashboardHeader'
import { ObjectiveCard } from '../objective/ObjectiveCard'
import { ObjectiveFormModal } from '../objective/ObjectiveFormModal'

export function Dashboard() {
  const periods = useOkrStore((s) => s.periods)
  const period = useSelectedPeriod()
  const executiveMode = useOkrStore((s) => s.executiveMode)
  const expandedObjectives = useOkrStore((s) => s.expandedObjectives)
  const addObjective = useOkrStore((s) => s.addObjective)

  const [showObjectiveModal, setShowObjectiveModal] = useState(false)

  if (!period) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">No planning periods yet.</p>
      </div>
    )
  }

  const draft = isPeriodDraft(period)
  const editable = isPeriodEditable(period) && !executiveMode
  const weightValidation = validateObjectiveWeights(period.objectives)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHeader period={period} periods={periods} />

        {executiveMode ? (
          <section className="space-y-3">
            {period.objectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                period={period}
                expanded={false}
                executiveMode
              />
            ))}
            {period.objectives.length === 0 && (
              <p className="text-center text-slate-500">No objectives in this period.</p>
            )}
          </section>
        ) : (
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
                  executiveMode={false}
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
        )}

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
