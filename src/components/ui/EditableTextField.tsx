import { useState, useEffect } from 'react'

type EditableTextFieldProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
  placeholder?: string
  multiline?: boolean
  rows?: number
  className?: string
  inputClassName?: string
}

const baseInputClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400'

export function EditableTextField({
  value,
  onChange,
  disabled = false,
  label,
  placeholder,
  multiline = false,
  rows = 2,
  className = '',
  inputClassName = baseInputClassName,
}: EditableTextFieldProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = () => {
    if (multiline) {
      onChange(draft)
      return
    }

    const trimmed = draft.trim()
    if (trimmed) {
      onChange(trimmed)
    } else {
      setDraft(value)
    }
  }

  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  return (
    <div className={className} data-no-toggle onClick={stopToggle} onMouseDown={stopToggle}>
      {label && <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>}
      {multiline ? (
        <textarea
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          className={inputClassName}
        />
      ) : (
        <input
          type="text"
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit()
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          className={inputClassName}
        />
      )}
    </div>
  )
}
