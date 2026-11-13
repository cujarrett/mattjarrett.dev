import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
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
  private readonly injector = inject(Injector)

  protected readonly data = signal<AutomergeStats | null>(null)
  protected readonly failed = signal(false)
  protected readonly grow = signal(false)
  // Bars wait at zero until they grow, so they never show full and then snap back.
  protected readonly armed = signal(false)
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
    // Weekly bars stay wide as the history grows.
    // Weeks start on the automerge day, so the "on" line sits between two bars.
    const live = Math.max(
      d.days.findIndex((day) => day.date >= d.since),
      0,
    )
    const firstStart = live % 7 === 0 ? 0 : (live % 7) - 7
    const weeks: { date: string; automatic: number; byHand: number }[] = []
    for (let start = firstStart; start < d.days.length; start += 7) {
      const days = d.days.slice(Math.max(start, 0), start + 7)
      weeks.push({
        date: days[0].date,
        automatic: days.reduce((sum, day) => sum + day.automatic, 0),
        byHand: days.reduce((sum, day) => sum + day.byHand, 0),
      })
    }
    const n = weeks.length
    const liveWeek = (live - firstStart) / 7
    const peak = Math.max(...weeks.map((w) => w.automatic + w.byHand), 1)
    // Four gridline steps, each a round number, sized to the busiest week.
    const raw = peak / 4
    const step =
      [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 50, 75, 100].find((s) => s >= raw) ?? Math.ceil(raw)
    const max = step * 4
    return {
      ticks: [max, (max * 3) / 4, max / 2, max / 4, 0],
      liveLeft: (liveWeek / n) * 100,
      labels: weeks
        .map((w, i) => ({ text: shortDate(w.date), left: (i / n) * 100 }))
        .filter((_, i) => i % 2 === 0),
      weeks: weeks.map((w) => ({
        auto: (w.automatic / max) * 100,
        hand: (w.byHand / max) * 100,
        title: `Week of ${shortDate(w.date)}: ${w.automatic} automatic, ${w.byHand} by hand`,
      })),
      summary: `Dependency updates merged per week from ${shortDate(weeks[0].date)}. Automerge went live on ${shortDate(d.since)}.`,
    }
  })

  constructor() {
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) return
      try {
        const { data, at } = await this.stats.automerge()
        this.armed.set(this.willAnimate())
        this.data.set(data)
        this.updatedAt.set(at)
      } catch {
        this.failed.set(true)
        return
      }
      // The chart exists only once the data has rendered, so wait for that render.
      afterNextRender(() => this.growWhenSeen(), { injector: this.injector })
    })
  }

  private willAnimate(): boolean {
    const win = this.host.nativeElement.ownerDocument.defaultView
    return (
      !!win &&
      'IntersectionObserver' in win &&
      !win.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }

  // The bars grow once, when the whole chart is on screen with room below it.
  private growWhenSeen() {
    const target: Element | null = this.host.nativeElement.querySelector('.chart')
    const win = target?.ownerDocument.defaultView
    if (!target || !win || !this.armed()) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect()
          this.grow.set(true)
        }
      },
      { threshold: 0.9, rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(target)
  }
}
