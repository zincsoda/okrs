function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

/** Returns a default quarterly period name like "2026 Q2". */
export function getDefaultQuarterName(date = new Date()): string {
  const year = date.getFullYear()
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `${year} Q${quarter}`
}

/** Returns ISO date strings for the current calendar quarter. */
export function getDefaultQuarterDates(date = new Date()): {
  startDate: string
  endDate: string
} {
  const year = date.getFullYear()
  const quarter = Math.floor(date.getMonth() / 3)
  const startMonth = quarter * 3
  const endMonth = startMonth + 2

  const start = new Date(year, startMonth, 1)
  const end = new Date(year, endMonth + 1, 0)

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  }
}

/** Returns the next period name after the given one (supports "2026 P2" and "2026 Q2" styles). */
export function getNextPeriodName(sourceName: string, nextStartDate?: string): string {
  const pMatch = sourceName.match(/^(\d{4})\s*P(\d+)$/i)
  if (pMatch) {
    const year = Number(pMatch[1])
    const period = Number(pMatch[2])
    if (period < 4) return `${year} P${period + 1}`
    return `${year + 1} P1`
  }

  const qMatch = sourceName.match(/^(\d{4})\s*Q(\d+)$/i)
  if (qMatch) {
    const year = Number(qMatch[1])
    const quarter = Number(qMatch[2])
    if (quarter < 4) return `${year} Q${quarter + 1}`
    return `${year + 1} Q1`
  }

  if (nextStartDate) {
    return getDefaultQuarterName(parseIsoDate(nextStartDate))
  }
  return getDefaultQuarterName()
}

/** Returns ISO dates for the period immediately following the source range. */
export function getNextPeriodDates(sourceStartDate: string, sourceEndDate: string): {
  startDate: string
  endDate: string
} {
  const start = parseIsoDate(sourceStartDate)
  const end = parseIsoDate(sourceEndDate)
  const durationMs = end.getTime() - start.getTime()

  const nextStart = new Date(end)
  nextStart.setDate(nextStart.getDate() + 1)

  const nextEnd = new Date(nextStart.getTime() + durationMs)

  return {
    startDate: toIsoDate(nextStart),
    endDate: toIsoDate(nextEnd),
  }
}

/** Derives next period metadata from an existing planning period. */
export function getNextPeriodFromSource(source: {
  name: string
  startDate: string
  endDate: string
}): { name: string; startDate: string; endDate: string } {
  const { startDate, endDate } = getNextPeriodDates(source.startDate, source.endDate)
  return {
    name: getNextPeriodName(source.name, startDate),
    startDate,
    endDate,
  }
}
