import { useState, useEffect, useRef } from 'react'

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const blockWheel = (e: WheelEvent) => e.preventDefault()
    input.addEventListener('wheel', blockWheel, { passive: false })
    return () => input.removeEventListener('wheel', blockWheel)
  }, [])

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
        ref={inputRef}
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
        onMouseDown={stopToggle}
        onClick={stopToggle}
        className="input-field disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  )
}
