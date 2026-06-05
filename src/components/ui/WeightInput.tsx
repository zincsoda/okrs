type WeightInputProps = {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
}

/** Weight input storing 0–1 internally, displayed as percentage. */
export function WeightInput({ value, onChange, disabled = false, label = 'Weight' }: WeightInputProps) {
  const percent = Math.round(value * 100)

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          value={percent}
          disabled={disabled}
          onChange={(e) => {
            const p = parseFloat(e.target.value)
            if (!Number.isNaN(p)) onChange(p / 100)
          }}
          className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <span className="text-sm text-slate-500">%</span>
      </div>
    </div>
  )
}
