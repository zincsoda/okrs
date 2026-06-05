import type { PlanningPeriod } from '../../types'

type PeriodSelectorProps = {
  periods: PlanningPeriod[]
  selectedId: string | null
  onSelect: (id: string) => void
  id?: string
}

export function PeriodSelector({ periods, selectedId, onSelect, id }: PeriodSelectorProps) {
  const sorted = [...periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )

  return (
    <div className="relative">
      <select
        id={id}
        value={selectedId ?? sorted[0]?.id ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="select-field appearance-none rounded-xl py-2.5 pl-4 pr-10 shadow-sm"
      >
        {sorted.map((period) => (
          <option key={period.id} value={period.id}>
            {period.name} ({period.status})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
