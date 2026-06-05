type StatusBadgeProps = {
  status: string
}

const statusStyles: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700 ring-slate-200',
  Active: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  Closed: 'bg-slate-200 text-slate-600 ring-slate-300',
  Completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status] ?? statusStyles.Draft}`}
    >
      {status}
    </span>
  )
}
