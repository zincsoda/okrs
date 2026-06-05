import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { WeightInput } from '../ui/WeightInput'

type ObjectiveFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    objectiveId: string
    title: string
    description: string
    owner: string
    weight: number
  }) => void
  initial?: {
    objectiveId: string
    title: string
    description: string
    owner: string
    weight: number
  }
  suggestedObjectiveId?: string
  title: string
}

export function ObjectiveFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  suggestedObjectiveId,
  title,
}: ObjectiveFormModalProps) {
  const [objectiveId, setObjectiveId] = useState(initial?.objectiveId ?? suggestedObjectiveId ?? '')
  const [formTitle, setFormTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [owner, setOwner] = useState(initial?.owner ?? '')
  const [weight, setWeight] = useState(initial?.weight ?? 0.25)

  useEffect(() => {
    if (open) {
      setObjectiveId(initial?.objectiveId ?? suggestedObjectiveId ?? '')
      setFormTitle(initial?.title ?? '')
      setDescription(initial?.description ?? '')
      setOwner(initial?.owner ?? '')
      setWeight(initial?.weight ?? 0.25)
    }
  }, [open, initial, suggestedObjectiveId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ objectiveId, title: formTitle, description, owner, weight })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Objective ID</label>
          <input
            type="text"
            value={objectiveId}
            onChange={(e) => setObjectiveId(e.target.value)}
            required
            placeholder="e.g. O1"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Owner</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <WeightInput value={weight} onChange={setWeight} />
        </div>
        <p className="text-xs text-slate-500">Recommended: 3–5 objectives per period, weights summing to 100%.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
