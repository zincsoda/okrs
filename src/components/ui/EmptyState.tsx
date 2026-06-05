import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  variant?: 'inline' | 'card'
}

export function EmptyState({ title, description, action, variant = 'inline' }: EmptyStateProps) {
  const content = (
    <>
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </>
  )

  if (variant === 'card') {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
        {content}
      </div>
    )
  }

  return <div className="py-8 text-center">{content}</div>
}
