import {
  ago,
  bytesPerSecond,
  daysSince,
  gibibytes,
  health,
  last,
  spanOf,
  sparkPoints,
} from './charts'

describe('homelab chart helpers', () => {
  it('health uses the dashboard thresholds', () => {
    expect(health(69, 70, 85)).toBe('good')
    expect(health(70, 70, 85)).toBe('warn')
    expect(health(85, 70, 85)).toBe('crit')
  })

  it('sparkPoints scales from the low to the high of the range', () => {
    const points = sparkPoints([10, null, 20], 30).split(' ')
    expect(points).toEqual(['0.00,27.00', '50.00,27.00', '100.00,3.00'])
  })

  it('sparkPoints draws a flat line through the middle', () => {
    expect(sparkPoints([5, 5], 30)).toBe('0.00,15.00 100.00,15.00')
  })

  it('spanOf shares one scale across series', () => {
    expect(spanOf([1, null, 4], [2, 9])).toEqual({ lo: 1, hi: 9 })
  })

  it('sparkPoints needs two points to draw a line', () => {
    expect(sparkPoints([5])).toBe('')
  })

  it('ago reads like a person would say it', () => {
    expect(ago(2_000)).toBe('just now')
    expect(ago(14_000)).toBe('14s ago')
    expect(ago(3 * 60_000)).toBe('3 min ago')
    expect(ago(5 * 3_600_000)).toBe('5 h ago')
    expect(ago(2 * 86_400_000)).toBe('2 d ago')
  })

  it('last skips trailing gaps', () => {
    expect(last([1, 2, null])).toBe(2)
    expect(last([])).toBe(0)
  })

  it('bytesPerSecond picks a readable unit', () => {
    expect(bytesPerSecond(1_300_000)).toBe('1.3 MB/s')
    expect(bytesPerSecond(304_000)).toBe('304 KB/s')
    expect(bytesPerSecond(12)).toBe('12 B/s')
  })

  it('daysSince counts calendar days', () => {
    expect(daysSince('2026-09-19', new Date(2026, 9, 17, 23, 59))).toBe(28)
    expect(daysSince('2026-10-17', new Date(2026, 9, 17, 0, 1))).toBe(0)
  })

  it('gibibytes rounds to the nominal size of a Pi', () => {
    expect(gibibytes(17_002_577_920)).toBe(16)
    expect(gibibytes(8_454_602_752)).toBe(8)
  })
})
