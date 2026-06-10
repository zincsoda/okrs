import { useEffect, useRef } from 'react'

type WeightInputProps = {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
}

/** Weight input storing 0–1 internally, displayed as percentage. */
export function WeightInput({ value, onChange, disabled = false, label = 'Weight' }: WeightInputProps) {
  const percent = Math.round(value * 100)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const blockWheel = (e: WheelEvent) => e.preventDefault()
    input.addEventListener('wheel', blockWheel, { passive: false })
    return () => input.removeEventListener('wheel', blockWheel)
  }, [])

  const stopToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  return (
    <div data-no-toggle onClick={stopToggle} onMouseDown={stopToggle}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={100}
          value={percent}
          disabled={disabled}
          onChange={(e) => {
            const p = parseFloat(e.target.value)
            if (!Number.isNaN(p)) onChange(p / 100)
          }}
          className="input-field w-20"
        />
        <span className="text-sm text-slate-500">%</span>
      </div>
    </div>
  )
}
