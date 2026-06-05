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
import { EditableTextField } from '../ui/EditableTextField'
import { WeightInput } from '../ui/WeightInput'
import { KeyResultCard } from '../keyResult/KeyResultCard'
import { KeyResultFormModal } from '../keyResult/KeyResultFormModal'
import { ObjectiveFormModal } from './ObjectiveFormModal'
import { useOkrStore } from '../../store/okrStore'

type ObjectiveCardProps = {
  objective: Objective
  period: PlanningPeriod
  expanded: boolean
  interactive?: boolean
  expandable?: boolean
}

export function ObjectiveCard({
  objective,
  period,
  expanded,
  interactive = false,
  expandable = false,
}: ObjectiveCardProps) {
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
  const editable = isPeriodEditable(period) && interactive
  const canToggle = interactive || expandable
  const showDetails = expanded && canToggle

  const krValidation = validateKeyResultWeights(objective)

  const handleHeaderActivate = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!canToggle) return
    if ((e.target as HTMLElement).closest('[data-no-toggle]')) return
    toggleExpanded(objective.id)
  }

  return (
    <div
      className={`card overflow-hidden transition ${canToggle ? 'hover:border-indigo-200' : ''}`}
    >
      <div
        className={`p-5 ${canToggle ? 'cursor-pointer' : ''}`}
        onClick={handleHeaderActivate}
        onKeyDown={(e) => {
          if (!canToggle) return
          if ((e.target as HTMLElement).closest('[data-no-toggle]')) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleExpanded(objective.id)
          }
        }}
        role={canToggle ? 'button' : undefined}
        tabIndex={canToggle ? 0 : undefined}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {objective.objectiveId}
              </span>
              {editable && expanded ? (
                <div className="min-w-0 flex-1">
                  <EditableTextField
                    value={objective.title}
                    onChange={(title) => updateObjective(period.id, objective.id, { title })}
                    inputClassName="input-field text-lg font-semibold"
                  />
                </div>
              ) : (
                <h3 className="text-lg font-semibold text-slate-900">{objective.title}</h3>
              )}
            </div>

            {editable && expanded && (
              <EditableTextField
                value={objective.description ?? ''}
                onChange={(description) =>
                  updateObjective(period.id, objective.id, {
                    description: description || undefined,
                  })
                }
                placeholder="Description (optional)"
                multiline
                rows={2}
                className="mt-2"
              />
            )}

            {expanded && !editable && objective.description && (
              <p className="mt-2 text-sm text-slate-500">{objective.description}</p>
            )}

            {editable && expanded ? (
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <EditableTextField
                  label="Owner"
                  value={objective.owner}
                  onChange={(owner) => updateObjective(period.id, objective.id, { owner })}
                  placeholder="Owner"
                />
                <WeightInput
                  label="Objective weight"
                  value={objective.weight}
                  onChange={(w) => updateObjective(period.id, objective.id, { weight: w })}
                />
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                {objective.owner && <span>{objective.owner}</span>}
                {objective.owner && <span aria-hidden>·</span>}
                <span>Objective weight {Math.round(objective.weight * 100)}%</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <span>Roll-up confidence</span>
                  <ConfidenceBadge confidence={confidence} size="sm" />
                </span>
              </div>
            )}
          </div>

          {canToggle && (
            <svg
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        <div className="mt-4">
          <ProgressBar progress={progress} />
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-slate-200 bg-slate-100/80 px-5 py-4">
          {editable && draft && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="btn-secondary btn-sm"
              >
                Edit objective
              </button>
              <button
                type="button"
                onClick={() => deleteObjective(period.id, objective.id)}
                className="btn-danger"
              >
                Delete
              </button>
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
            {objective.keyResults.length === 0 && (
              <p className="text-center text-sm text-slate-500">No key results for this objective.</p>
            )}
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

          {editable && objective.keyResults.length > 0 && (
            <div
              className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              title="Calculated from key result confidence levels below"
            >
              <p className="text-xs text-slate-500">
                Objective roll-up confidence{' '}
                <span className="text-slate-400">(derived from key results)</span>
              </p>
              <ConfidenceBadge confidence={confidence} size="sm" />
            </div>
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
