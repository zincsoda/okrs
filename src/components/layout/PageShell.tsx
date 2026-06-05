import type { ReactNode } from 'react'

type PageShellProps = {
  children: ReactNode
  footer?: ReactNode
}

export function PageShell({ children, footer }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
      {footer}
    </div>
  )
}
