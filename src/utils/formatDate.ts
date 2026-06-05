const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDate(iso: string): string {
  return parseDate(iso).toLocaleDateString('en-GB', DATE_FORMAT)
}

export function formatPeriodRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}
