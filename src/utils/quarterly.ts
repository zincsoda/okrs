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
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}
