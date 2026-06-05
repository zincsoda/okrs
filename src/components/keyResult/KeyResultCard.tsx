import type { Confidence, KeyResult } from '../../types'
import { selectKrProgress } from '../../store/selectors'
import { ProgressBar } from '../ui/ProgressBar'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { EditableNumberField } from '../ui/EditableNumberField'
import { EditableTextField } from '../ui/EditableTextField'
import { WeightInput } from '../ui/WeightInput'

type KeyResultCardProps = {
  keyResult: KeyResult
  editable: boolean
  draftPeriod: boolean
  onUpdate: (updates: Partial<KeyResult>) => void
  onDelete: () => void
}

export function KeyResultCard({
  keyResult,
  editable,
  draftPeriod,
  onUpdate,
  onDelete,
}: KeyResultCardProps) {
  const progress = selectKrProgress(keyResult)

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {keyResult.keyResultId}
            </span>
            {editable ? (
              <div className="min-w-0 flex-1">
                <EditableTextField
                  value={keyResult.title}
                  onChange={(title) => onUpdate({ title })}
                  inputClassName="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            ) : (
              <h4 className="font-medium text-slate-900">{keyResult.title}</h4>
            )}
          </div>
          {editable ? (
            <EditableTextField
              value={keyResult.owner}
              onChange={(owner) => onUpdate({ owner })}
              placeholder="Owner"
              className="mt-1"
              inputClassName="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          ) : (
            <p className="mt-0.5 text-sm text-slate-500">{keyResult.owner}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={keyResult.confidence} size="sm" />
          {editable && draftPeriod && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Delete key result"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <ProgressBar progress={progress} size="sm" />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <EditableNumberField
            label="Baseline"
            value={keyResult.baseline}
            disabled={!editable}
            onChange={(baseline) => onUpdate({ baseline })}
          />
        </div>
        <div>
          <EditableNumberField
            label="Current"
            value={keyResult.current}
            disabled={!editable}
            onChange={(v) => onUpdate({ current: v })}
          />
        </div>
        <div>
          <EditableNumberField
            label="Target"
            value={keyResult.target}
            disabled={!editable}
            onChange={(target) => onUpdate({ target })}
          />
        </div>
        <div>
          {draftPeriod && editable ? (
            <WeightInput
              value={keyResult.weight}
              onChange={(w) => onUpdate({ weight: w })}
            />
          ) : (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Weight</p>
              <p className="text-sm font-medium text-slate-700">{Math.round(keyResult.weight * 100)}%</p>
            </div>
          )}
        </div>
      </div>

      {editable && (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-500">Confidence</label>
          <select
            value={keyResult.confidence}
            disabled={!editable}
            onChange={(e) => onUpdate({ confidence: e.target.value as Confidence })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      )}

      {keyResult.notes !== undefined ? (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-500">Notes</label>
          {editable ? (
            <textarea
              value={keyResult.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          ) : (
            <p className="text-sm text-slate-500">{keyResult.notes}</p>
          )}
        </div>
      ) : (
        editable && (
          <button
            type="button"
            onClick={() => onUpdate({ notes: '' })}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
          >
            + Add notes
          </button>
        )
      )}

    </div>
  )
}
