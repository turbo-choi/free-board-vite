import { formatApiDate, parseApiDate } from '@/lib/datetime'

describe('parseApiDate', () => {
  it('keeps date-only values anchored to local midnight', () => {
    const parsed = parseApiDate('2026-03-25')

    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(2)
    expect(parsed.getDate()).toBe(25)
    expect(parsed.getHours()).toBe(0)
    expect(parsed.getMinutes()).toBe(0)
  })

  it('parses backend timestamps without timezone markers as local datetimes', () => {
    const parsed = parseApiDate('2026-03-25 13:45:30')

    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(2)
    expect(parsed.getDate()).toBe(25)
    expect(parsed.getHours()).toBe(13)
    expect(parsed.getMinutes()).toBe(45)
    expect(parsed.getSeconds()).toBe(30)
  })
})

describe('formatApiDate', () => {
  it('formats API timestamps in KST', () => {
    expect(formatApiDate('2026-03-25T00:00:00Z', 'yyyy-MM-dd HH:mm')).toBe('2026-03-25 09:00')
  })
})
