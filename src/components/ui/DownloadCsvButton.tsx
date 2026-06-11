import type { PlanningPeriod } from '../../types'
import { downloadOkrCsv } from '../../utils/csvExport'

type DownloadCsvButtonProps = {
  periods: PlanningPeriod[]
  label?: string
  className?: string
}

export function DownloadCsvButton({
  periods,
  label = 'Download CSV',
  className = 'btn-secondary',
}: DownloadCsvButtonProps) {
  const disabled = periods.length === 0 || periods.every((period) => period.objectives.length === 0)

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => downloadOkrCsv(periods)}
    >
      {label}
    </button>
  )
}
