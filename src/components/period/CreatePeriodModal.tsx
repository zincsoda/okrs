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
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="e.g. 2026 Q3"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Create period
          </button>
        </div>
      </form>
    </Modal>
  )
}
