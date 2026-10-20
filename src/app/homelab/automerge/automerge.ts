import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core'
import { DecimalPipe, isPlatformBrowser } from '@angular/common'
import { AutomergeStats, Stats } from '../stats'
import { ago, shortDate } from '../charts'
import { Reveal } from '../../shared/reveal'
import { LiveSource } from '../live-source'

@Component({
  selector: 'app-automerge',
  imports: [DecimalPipe, Reveal, LiveSource],
  templateUrl: './automerge.html',
  styleUrl: './automerge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Automerge {
  private readonly stats = inject(Stats)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly host = inject(ElementRef<HTMLElement>)

  protected readonly data = signal<AutomergeStats | null>(null)
  protected readonly failed = signal(false)
  protected readonly grow = signal(false)
  protected readonly updatedAt = signal<number | null>(null)

  protected readonly details = computed(() => {
    const d = this.data()
    const lastMerge = d ? Date.parse(d.updated) : NaN
    return Number.isNaN(lastMerge) ? [] : [`last merge ${ago(Date.now() - lastMerge)}`]
  })
  // Every pull request in the chart, for anyone who wants to check the count.
  protected readonly links = [
    {
      label: 'The pull requests',
      href: 'https://github.com/search?q=is%3Apr+is%3Amerged+author%3Aapp%2Frenovate+user%3Acujarrett&type=pullrequests&s=updated',
    },
  ]

  protected readonly chart = computed(() => {
    const d = this.data()
    if (!d || d.days.length === 0) return null
    const n = d.days.length
    const peak = Math.max(...d.days.map((day) => day.automatic + day.byHand), 1)
    // Four gridline steps, each a round number, sized to the busiest day.
    const raw = peak / 4
    const step = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 50].find((s) => s >= raw) ?? Math.ceil(raw)
    const max = step * 4
    const live = d.days.findIndex((day) => day.date >= d.since)
    return {
      ticks: [max, (max * 3) / 4, max / 2, max / 4, 0],
      liveLeft: (Math.max(live, 0) / n) * 100,
      labels: d.days
        .map((day, i) => ({ text: shortDate(day.date), left: (i / n) * 100 }))
        .filter((_, i) => i % 14 === 0),
      days: d.days.map((day) => ({
        auto: (day.automatic / max) * 100,
        hand: (day.byHand / max) * 100,
        title: `${shortDate(day.date)}: ${day.automatic} automatic, ${day.byHand} by hand`,
      })),
      summary: `Dependency updates merged per day from ${shortDate(d.days[0].date)}. Automerge went live on ${shortDate(d.since)}.`,
    }
  })

  constructor() {
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) return
      try {
        const { data, at } = await this.stats.automerge()
        this.data.set(data)
        this.updatedAt.set(at)
      } catch {
        this.failed.set(true)
        return
      }
      const target: HTMLElement = this.host.nativeElement
      const win = target.ownerDocument.defaultView
      if (!win || !('IntersectionObserver' in win)) return
      if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      // The bars grow once, the first time the chart scrolls into view.
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer.disconnect()
            this.grow.set(true)
          }
        },
        { threshold: 0.5 },
      )
      observer.observe(target)
    })
  }
}
