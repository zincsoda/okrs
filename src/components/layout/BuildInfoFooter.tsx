import { buildCommitDate, buildCommitId } from '../../buildInfo'

function formatCommitDate(iso: string): string {
  if (!iso) return 'unknown date'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function BuildInfoFooter() {
  return (
    <footer className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
      <span>Commit {buildCommitId}</span>
      <span aria-hidden="true" className="mx-2">
        ·
      </span>
      <time dateTime={buildCommitDate}>{formatCommitDate(buildCommitDate)}</time>
    </footer>
  )
}
