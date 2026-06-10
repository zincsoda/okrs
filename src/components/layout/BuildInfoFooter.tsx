import { buildCommitDate, buildCommitId } from '../../buildInfo'

function formatCommitTimestamp(iso: string): string {
  if (!iso) return 'unknown date'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BuildInfoFooter() {
  return (
    <footer className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
      <span>Commit {buildCommitId}</span>
      <span aria-hidden="true" className="mx-2">
        ·
      </span>
      <time dateTime={buildCommitDate}>{formatCommitTimestamp(buildCommitDate)}</time>
    </footer>
  )
}
