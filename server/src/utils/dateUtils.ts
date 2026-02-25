export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

/**
 * Returns true if the current time in US/Eastern has passed the ACH cutoff hour.
 * Default cutoff is 1 PM ET (13:00).
 */
export function isCutoffPassed(now: Date, cutoffHourET = 13): boolean {
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false })
  const currentHourET = parseInt(etString, 10)
  return currentHourET >= cutoffHourET
}
