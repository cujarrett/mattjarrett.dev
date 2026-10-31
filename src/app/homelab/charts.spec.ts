import {
  ago,
  thresholdStops,
  bytesPerSecond,
  daysSince,
  gibibytes,
  health,
  interval,
  last,
  niceTicks,
  rateLabel,
  scrollProgress,
  spanOf,
  sparkCoords,
  sparkPoints,
  stampOf,
  timeTicks,
} from './charts'

// Built from local clock parts and in July, so the expected ticks hold in any time zone.
const local = (day: number, hour: number, minute = 0) =>
  new Date(2026, 6, day, hour, minute).getTime() / 1000
// Narrow no-break spaces in times become plain ones, which is how the tests write them.
const plain = (text: string) => text.replace(/\s/g, ' ')

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

  it('thresholdStops stays green below the warning line and turns where the line crosses it', () => {
    expect(new Set(thresholdStops({ lo: 10, hi: 60 }, 70, 85).map((s) => s.offset))).toEqual(
      new Set([0, 1]),
    )
    const stops = thresholdStops({ lo: 0, hi: 100 }, 70, 85)
    const warn = stops.find((s) => s.tone === 'warn')!.offset
    expect(warn).toBeCloseTo((30 - 3 - 0.85 * 24) / 30)
  })

  it('sparkCoords gives one point per sample, with gaps at the low point', () => {
    expect(sparkCoords([10, null, 20], 30)).toEqual([
      { x: 0, y: 27 },
      { x: 50, y: 27 },
      { x: 100, y: 3 },
    ])
    expect(sparkCoords([null, null])).toEqual([])
  })

  it('spanOf has no range for a series with no samples', () => {
    expect(spanOf([null, null])).toEqual({ lo: 0, hi: 0 })
  })

  it('timeTicks lands on round local hours for a day of samples', () => {
    const stamps = Array.from({ length: 48 }, (_, i) => local(15, 4, 30) + i * 1800)
    const ticks = timeTicks(stamps)
    expect(ticks.map((t) => plain(t.label))).toEqual(['6 AM', '12 PM', '6 PM', '12 AM'])
    expect(ticks[0].left).toBeCloseTo((1.5 / 23.5) * 100)
  })

  it('timeTicks gives a week one weekday label per midnight', () => {
    const stamps = Array.from({ length: 56 }, (_, i) => local(14, 6) + i * 10_800)
    const days = [15, 16, 17, 18, 19, 20].map((d) =>
      new Date(2026, 6, d).toLocaleString('en-US', { weekday: 'short' }),
    )
    expect(timeTicks(stamps).map((t) => t.label)).toEqual(days)
  })

  it('timeTicks gives a month one date label a week apart', () => {
    const stamps = Array.from({ length: 60 }, (_, i) => local(1, 12) + i * 43_200)
    const ticks = timeTicks(stamps)
    expect(ticks.length).toBeGreaterThanOrEqual(3)
    expect(ticks.every((t) => /^[A-Z][a-z]{2} \d+$/.test(t.label))).toBe(true)
    expect(ticks[1].left - ticks[0].left).toBeCloseTo((7 / 29.5) * 100)
  })

  it('timeTicks needs a window to draw ticks in', () => {
    expect(timeTicks([1])).toEqual([])
    expect(timeTicks([1, 2])).toEqual([])
  })

  it('stampOf shows minutes for close samples and just the hour for far apart ones', () => {
    expect(plain(stampOf(local(15, 22, 30), 1800))).toMatch(/^[A-Z][a-z]{2} 10:30 PM$/)
    expect(plain(stampOf(local(15, 21), 10_800))).toBe('Jul 15, 9 PM')
  })

  it('interval names the gap between samples', () => {
    expect(interval(1800)).toBe('30 min')
    expect(interval(10_800)).toBe('3 h')
    expect(interval(43_200)).toBe('12 h')
  })

  it('niceTicks brackets the data with round numbers', () => {
    expect(niceTicks(23.4, 31.8)).toEqual({ span: { lo: 20, hi: 35 }, ticks: [20, 25, 30, 35] })
    expect(niceTicks(0, 18_400_000)).toEqual({
      span: { lo: 0, hi: 20_000_000 },
      ticks: [0, 10_000_000, 20_000_000],
    })
    expect(niceTicks(5, 5).span).toEqual({ lo: 5, hi: 6 })
  })

  it('rateLabel drops a trailing .0', () => {
    expect(rateLabel(12_000_000)).toBe('12 MB/s')
    expect(rateLabel(1_500_000)).toBe('1.5 MB/s')
    expect(rateLabel(400_000)).toBe('400 KB/s')
  })

  it('scrollProgress eases from the chart peeking in to its middle above centre', () => {
    expect(scrollProgress(900, 400, 1000)).toBe(0)
    expect(scrollProgress(712.5, 400, 1000)).toBe(0.15625)
    expect(scrollProgress(525, 400, 1000)).toBe(0.5)
    expect(scrollProgress(150, 400, 1000)).toBe(1)
    expect(scrollProgress(2000, 400, 1000)).toBe(0)
    expect(scrollProgress(-500, 400, 1000)).toBe(1)
  })
})
