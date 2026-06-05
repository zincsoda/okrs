import { useOkrStore } from '../../store/okrStore'

export function SaveControls() {
  const isDirty = useOkrStore((s) => s.isDirty)
  const saveStatus = useOkrStore((s) => s.saveStatus)
  const saveError = useOkrStore((s) => s.saveError)
  const saveChanges = useOkrStore((s) => s.saveChanges)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isDirty && saveStatus !== 'saving' && (
        <span className="text-sm font-medium text-amber-600">Unsaved changes</span>
      )}
      {saveStatus === 'saving' && <span className="text-sm text-slate-500">Saving…</span>}
      {saveStatus === 'error' && (
        <span className="text-sm text-red-600">{saveError ?? 'Save failed'}</span>
      )}
      <button
        type="button"
        disabled={!isDirty || saveStatus === 'saving'}
        onClick={() => void saveChanges()}
        className="btn-primary"
      >
        Save changes
      </button>
    </div>
  )
}
