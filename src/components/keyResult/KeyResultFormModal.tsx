import { useState } from 'react'
import type { Confidence } from '../../types'
import { Modal } from '../ui/Modal'
import { WeightInput } from '../ui/WeightInput'

type KeyResultFormModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    owner: string
    baseline: number
    target: number
    weight: number
    confidence: Confidence
    notes: string
  }) => void
  title: string
}

export function KeyResultFormModal({ open, onClose, onSubmit, title }: KeyResultFormModalProps) {
  const [formTitle, setFormTitle] = useState('')
  const [owner, setOwner] = useState('')
  const [baseline, setBaseline] = useState(0)
  const [target, setTarget] = useState(100)
  const [weight, setWeight] = useState(0.5)
  const [confidence, setConfidence] = useState<Confidence>('Medium')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title: formTitle, owner, baseline, target, weight, confidence, notes })
    setFormTitle('')
    setOwner('')
    setBaseline(0)
    setTarget(100)
    setWeight(0.5)
    setConfidence('Medium')
    setNotes('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Title</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="form-label">Owner</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Baseline</label>
            <input
              type="number"
              value={baseline}
              onChange={(e) => setBaseline(parseFloat(e.target.value) || 0)}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Target</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
              required
              className="input-field"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <WeightInput value={weight} onChange={setWeight} />
          <div>
            <label className="form-label">Confidence</label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value as Confidence)}
              className="select-field"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="input-field"
          />
        </div>
        <p className="text-xs text-slate-500">Recommended: 2–4 key results per objective, weights summing to 100%.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-sm">
            Add key result
          </button>
        </div>
      </form>
    </Modal>
  )
}
