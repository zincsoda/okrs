import type { Confidence, KeyResult } from '../../types'
import { selectKrProgress } from '../../store/selectors'
import { ProgressBar } from '../ui/ProgressBar'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import { EditableNumberField } from '../ui/EditableNumberField'
import { EditableTextField } from '../ui/EditableTextField'
import { WeightInput } from '../ui/WeightInput'
import { CopyButton } from '../ui/CopyButton'

type DragHandleProps = {
  role?: string
  tabIndex?: number
  'aria-describedby'?: string
  'aria-pressed'?: boolean | 'mixed' | 'false' | 'true'
  'aria-roledescription'?: string
  'aria-disabled'?: boolean
  onKeyDown?: (event: React.KeyboardEvent) => void
  onPointerDown?: (event: React.PointerEvent) => void
}

type KeyResultCardProps = {
  keyResult: KeyResult
  editable: boolean
  draftPeriod: boolean
  sortable?: boolean
  dragHandleProps?: DragHandleProps
  onUpdate: (updates: Partial<KeyResult>) => void
  onDelete: () => void
}

export function KeyResultCard({
  keyResult,
  editable,
  draftPeriod,
  sortable = false,
  dragHandleProps,
  onUpdate,
  onDelete,
}: KeyResultCardProps) {
  const progress = selectKrProgress(keyResult)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {sortable && dragHandleProps && (
              <button
                type="button"
                data-no-toggle
                className="cursor-grab touch-none rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
                aria-label={`Drag to reorder ${keyResult.keyResultId}`}
                {...dragHandleProps}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M7 4a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
              </button>
            )}
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {keyResult.keyResultId}
            </span>
            {editable ? (
              <div className="min-w-0 flex-1">
                <EditableTextField
                  value={keyResult.title}
                  onChange={(title) => onUpdate({ title })}
                  inputClassName="input-field font-medium"
                />
              </div>
            ) : (
              <h4 className="font-medium text-slate-900">{keyResult.title}</h4>
            )}
            <CopyButton text={keyResult.title} label="Copy key result" />
          </div>
          {editable ? (
            <EditableTextField
              value={keyResult.owner}
              onChange={(owner) => onUpdate({ owner })}
              placeholder="Owner"
              className="mt-1"
            />
          ) : (
            <p className="mt-0.5 text-sm text-slate-500">{keyResult.owner}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!editable && <ConfidenceBadge confidence={keyResult.confidence} size="sm" />}
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

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Metrics</p>
        <div className="grid grid-cols-4 gap-3">
          <EditableNumberField
            label="Baseline"
            value={keyResult.baseline}
            disabled={!editable}
            onChange={(baseline) => onUpdate({ baseline })}
          />
          <EditableNumberField
            label="Current"
            value={keyResult.current}
            disabled={!editable}
            onChange={(v) => onUpdate({ current: v })}
          />
          <EditableNumberField
            label="Target"
            value={keyResult.target}
            disabled={!editable}
            onChange={(target) => onUpdate({ target })}
          />
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
          <label className="mb-1 block text-xs font-medium text-slate-500">Key result confidence</label>
          <select
            value={keyResult.confidence}
            onChange={(e) => onUpdate({ confidence: e.target.value as Confidence })}
            className="select-field"
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
              className="input-field"
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
