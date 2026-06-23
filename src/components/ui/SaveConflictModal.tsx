import { useState } from 'react'
import { useOkrStore } from '../../store/okrStore'
import { copyToClipboard } from '../../utils/clipboard'
import { formatLocalChangesForClipboard } from '../../utils/formatLocalChanges'
import { Modal } from './Modal'

export function SaveConflictModal() {
  const saveConflict = useOkrStore((s) => s.saveConflict)
  const periods = useOkrStore((s) => s.periods)
  const selectedPeriodId = useOkrStore((s) => s.selectedPeriodId)
  const dismissSaveConflict = useOkrStore((s) => s.dismissSaveConflict)
  const reloadAfterConflict = useOkrStore((s) => s.reloadAfterConflict)
  const [copied, setCopied] = useState(false)

  const handleCopyChanges = async () => {
    if (!saveConflict) return

    const text = formatLocalChangesForClipboard({
      serverPeriods: saveConflict.periods,
      localPeriods: periods,
      serverSelectedPeriodId: saveConflict.selectedPeriodId,
      localSelectedPeriodId: selectedPeriodId,
    })

    await copyToClipboard(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal
      open={saveConflict !== null}
      onClose={dismissSaveConflict}
      title="Save conflict"
    >
      <p className="text-sm text-slate-600">
        Someone else saved changes while you were editing. Your unsaved changes have not been
        written to the server.
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Copy your edits before reloading if you want to re-apply them manually. Reloading will
        discard your local changes.
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={dismissSaveConflict} className="btn-secondary btn-sm">
          Keep editing
        </button>
        <button type="button" onClick={() => void handleCopyChanges()} className="btn-secondary btn-sm">
          {copied ? 'Copied!' : 'Copy my changes'}
        </button>
        <button type="button" onClick={reloadAfterConflict} className="btn-primary btn-sm">
          Reload latest
        </button>
      </div>
    </Modal>
  )
}
