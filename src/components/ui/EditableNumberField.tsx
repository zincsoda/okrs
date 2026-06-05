import { useState, useEffect } from 'react'

type EditableNumberFieldProps = {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
  step?: number
  className?: string
}

export function EditableNumberField({
  value,
  onChange,
  disabled = false,
  label,
  step = 1,
  className = '',
}: EditableNumberFieldProps) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const parsed = parseFloat(draft)
    if (!Number.isNaN(parsed)) {
      onChange(parsed)
    } else {
      setDraft(String(value))
    }
  }

  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  return (
    <div className={className} data-no-toggle onClick={stopToggle} onMouseDown={stopToggle}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      )}
      <input
        type="number"
        step={step}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit()
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  )
}
