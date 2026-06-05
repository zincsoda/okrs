import { useState } from 'react'
import type { Objective, PlanningPeriod } from '../../types'
import {
  selectObjectiveConfidence,
  selectObjectiveProgress,
  isPeriodDraft,
  isPeriodEditable,
} from '../../store/selectors'
import { validateKeyResultWeights } from '../../utils/validation'
import { ProgressBar } from '../ui/ProgressBar'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { WeightInput } from '../ui/WeightInput'
import { KeyResultCard } from '../keyResult/KeyResultCard'
import { KeyResultFormModal } from '../keyResult/KeyResultFormModal'
import { ObjectiveFormModal } from './ObjectiveFormModal'
import { useOkrStore } from '../../store/okrStore'

type ObjectiveCardProps = {
  objective: Objective
  period: PlanningPeriod
  expanded: boolean
  executiveMode: boolean
}

export function ObjectiveCard({ objective, period, expanded, executiveMode }: ObjectiveCardProps) {
  const [showKrModal, setShowKrModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const toggleExpanded = useOkrStore((s) => s.toggleObjectiveExpanded)
  const updateObjective = useOkrStore((s) => s.updateObjective)
  const deleteObjective = useOkrStore((s) => s.deleteObjective)
  const addKeyResult = useOkrStore((s) => s.addKeyResult)
  const updateKeyResult = useOkrStore((s) => s.updateKeyResult)
  const deleteKeyResult = useOkrStore((s) => s.deleteKeyResult)

  const progress = selectObjectiveProgress(objective)
  const confidence = selectObjectiveConfidence(objective)
  const draft = isPeriodDraft(period)
  const editable = isPeriodEditable(period) && !executiveMode
  const showDetails = expanded && !executiveMode

  const krValidation = validateKeyResultWeights(objective)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div
        className={`p-5 ${!executiveMode ? 'cursor-pointer' : ''}`}
        onClick={() => !executiveMode && toggleExpanded(objective.id)}
        onKeyDown={(e) => {
          if (!executiveMode && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            toggleExpanded(objective.id)
          }
        }}
        role={executiveMode ? undefined : 'button'}
        tabIndex={executiveMode ? undefined : 0}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {objective.objectiveId}
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{objective.title}</h3>
              <ConfidenceBadge confidence={confidence} size="sm" />
              {!executiveMode && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {objective.keyResults.length} KRs
                </span>
              )}
            </div>
            {!executiveMode && objective.description && (
              <p className="mt-1 text-sm text-slate-500">{objective.description}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">{objective.owner}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-sm font-medium text-slate-600">
              Weight: {Math.round(objective.weight * 100)}%
            </span>
            {!executiveMode && (
              <svg
                className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar progress={progress} />
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-4">
          {editable && draft && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Edit objective
              </button>
              <button
                type="button"
                onClick={() => deleteObjective(period.id, objective.id)}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete
              </button>
              <div className="ml-auto w-28">
                <WeightInput
                  value={objective.weight}
                  onChange={(w) => updateObjective(period.id, objective.id, { weight: w })}
                />
              </div>
            </div>
          )}

          {!krValidation.valid && draft && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {krValidation.errors.map((err) => (
                <p key={err}>{err}</p>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {objective.keyResults.map((kr) => (
              <KeyResultCard
                key={kr.id}
                keyResult={kr}
                editable={editable}
                draftPeriod={draft}
                onUpdate={(updates) => updateKeyResult(period.id, objective.id, kr.id, updates)}
                onDelete={() => deleteKeyResult(period.id, objective.id, kr.id)}
              />
            ))}
          </div>

          {editable && draft && (
            <button
              type="button"
              onClick={() => setShowKrModal(true)}
              className="mt-4 w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              + Add key result
            </button>
          )}
        </div>
      )}

      <ObjectiveFormModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Objective"
        initial={{
          objectiveId: objective.objectiveId,
          title: objective.title,
          description: objective.description ?? '',
          owner: objective.owner,
          weight: objective.weight,
        }}
        onSubmit={(data) => {
          updateObjective(period.id, objective.id, {
            objectiveId: data.objectiveId,
            title: data.title,
            description: data.description || undefined,
            owner: data.owner,
            weight: data.weight,
          })
        }}
      />

      <KeyResultFormModal
        open={showKrModal}
        onClose={() => setShowKrModal(false)}
        title="Add Key Result"
        onSubmit={(data) => {
          addKeyResult(period.id, objective.id, {
            ...data,
            current: data.baseline,
            notes: data.notes || undefined,
          })
        }}
      />
    </div>
  )
}
