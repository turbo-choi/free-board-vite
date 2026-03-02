import { formatInTimeZone } from 'date-fns-tz'

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/
const HAS_TIMEZONE_REGEX = /(Z|[+-]\d{2}:\d{2})$/i
const KST_TIMEZONE = 'Asia/Seoul'

export function parseApiDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value
  }

  const raw = value.trim()
  if (!raw) {
    return new Date(Number.NaN)
  }

  // Backend timestamps are stored as timezone-less system-local strings.
  // Parse them as local time before formatting to the requested timezone.
  if (DATE_ONLY_REGEX.test(raw)) {
    return new Date(`${raw}T00:00:00`)
  }

  if (HAS_TIMEZONE_REGEX.test(raw)) {
    return new Date(raw)
  }

  return new Date(raw.replace(' ', 'T'))
}

export function formatApiDate(value: string | Date, pattern: string): string {
  return formatInTimeZone(parseApiDate(value), KST_TIMEZONE, pattern)
}

export function formatNowKst(pattern: string): string {
  return formatInTimeZone(new Date(), KST_TIMEZONE, pattern)
}
