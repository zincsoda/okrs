import type { Confidence } from '../../types'
import { getConfidenceBadgeClasses } from '../../utils/confidence'

type ConfidenceBadgeProps = {
  confidence: Confidence
  size?: 'sm' | 'md'
}

export function ConfidenceBadge({ confidence, size = 'md' }: ConfidenceBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${sizeClasses} ${getConfidenceBadgeClasses(confidence)}`}
    >
      {confidence}
    </span>
  )
}
