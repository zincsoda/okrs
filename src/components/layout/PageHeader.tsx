import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  badges?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  badges,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">{eyebrow}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              {badges}
            </div>
            {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
          )}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  )
}
