/**
 * NOTE: The holiday list covers 2024–2025 Federal Reserve holidays and must be updated annually.
 * In production, consider storing holidays in the database or using a dedicated holiday API.
 */
const HOLIDAYS = new Set([
  '2024-01-01', '2024-01-15', '2024-02-19', '2024-05-27',
  '2024-06-19', '2024-07-04', '2024-09-02', '2024-10-14',
  '2024-11-11', '2024-11-28', '2024-12-25',
  '2025-01-01', '2025-01-20', '2025-02-17', '2025-05-26',
  '2025-06-19', '2025-07-04', '2025-09-01', '2025-10-13',
  '2025-11-11', '2025-11-27', '2025-12-25',
]);

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  return !HOLIDAYS.has(toIsoDate(date));
}

export function nextBusinessDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (!isBusinessDay(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Returns true if the given UTC time is before 1:00 PM US/Eastern.
 *
 * NOTE: This uses an approximation for DST transitions. In production,
 * replace with a proper timezone library (e.g. 'luxon' or 'date-fns-tz')
 * to guarantee accuracy for cutoff-sensitive banking operations.
 */
export function isBefore1PMET(date: Date): boolean {
  // Approximate EST/EDT offset — production would use a tz library
  const etOffsetHours = isEasternDST(date) ? -4 : -5;
  const etHour = date.getUTCHours() + etOffsetHours;
  const normalizedHour = ((etHour % 24) + 24) % 24;
  return normalizedHour < 13;
}

function isEasternDST(date: Date): boolean {
  const year = date.getUTCFullYear();
  // DST starts 2nd Sunday in March, ends 1st Sunday in November
  const dstStart = getNthSundayOfMonth(year, 2, 2); // March (month index 2), 2nd Sunday
  const dstEnd = getNthSundayOfMonth(year, 10, 1);  // November (month index 10), 1st Sunday
  return date >= dstStart && date < dstEnd;
}

function getNthSundayOfMonth(year: number, month: number, n: number): Date {
  const date = new Date(Date.UTC(year, month, 1));
  while (date.getUTCDay() !== 0) date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCDate(date.getUTCDate() + (n - 1) * 7);
  date.setUTCHours(7, 0, 0, 0); // 2 AM ET = 7 AM UTC (EST)
  return date;
}

/**
 * Returns effective settlement date.
 * If submittedAt is before 1 PM ET on a business day, effective date is that day.
 * Otherwise, next business day.
 */
export function getEffectiveDate(requestedDate?: Date, submittedAt?: Date): Date {
  const now = submittedAt ?? new Date();

  if (requestedDate) {
    const req = new Date(requestedDate);
    req.setUTCHours(0, 0, 0, 0);
    if (isBusinessDay(req) && req >= startOfDay(now)) return req;
  }

  if (isBusinessDay(now) && isBefore1PMET(now)) {
    const today = startOfDay(now);
    return today;
  }

  return nextBusinessDay(now);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
