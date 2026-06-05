import { getProgressColorClass, progressToPercent } from '../../utils/calculations'

type ProgressBarProps = {
  progress: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function ProgressBar({ progress, showLabel = true, size = 'md' }: ProgressBarProps) {
  const percent = progressToPercent(progress)
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 overflow-hidden rounded-full bg-slate-100 ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ease-out ${getProgressColorClass(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="min-w-[3rem] text-right text-sm font-medium tabular-nums text-slate-700">
          {percent}%
        </span>
      )}
    </div>
  )
}
