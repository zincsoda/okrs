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
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Save changes
      </button>
    </div>
  )
}
