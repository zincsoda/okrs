import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { getDefaultQuarterDates, getDefaultQuarterName } from '../../utils/quarterly'

type CreatePeriodModalProps = {
  open: boolean
  onClose: () => void
  onCreate: (name: string, startDate: string, endDate: string) => void
}

export function CreatePeriodModal({ open, onClose, onCreate }: CreatePeriodModalProps) {
  const defaults = getDefaultQuarterDates()
  const [name, setName] = useState(getDefaultQuarterName())
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [endDate, setEndDate] = useState(defaults.endDate)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(name, startDate, endDate)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Planning Period">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
            placeholder="e.g. 2026 Q3"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="input-field"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" className="btn-primary btn-sm">
            Create period
          </button>
        </div>
      </form>
    </Modal>
  )
}
