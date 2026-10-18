import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { ago } from './charts'

export interface SourceLink {
  label: string
  href: string
}

// A small inline marker saying the numbers are live and how fresh they are. It
// shares a row that already exists, so it never takes a line of its own.
@Component({
  selector: 'app-live-source',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="dot" [class.down]="updatedAt() === null" aria-hidden="true"></span>
    <span>{{ status() }}</span>
    @for (d of details(); track d) {
      <span class="sep" aria-hidden="true">·</span><span>{{ d }}</span>
    }
    @for (l of links(); track l.href) {
      <span class="sep" aria-hidden="true">·</span
      ><a [href]="l.href" target="_blank" rel="noopener noreferrer">{{ l.label }} ↗</a>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 8px;
      font-size: 12px;
      color: var(--hl-ink-2);
      font-variant-numeric: tabular-nums;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--hl-good);
      animation: pulse 2s ease-out infinite;
    }
    .dot.down {
      background: var(--hl-muted);
      animation: none;
    }
    .sep {
      color: var(--hl-muted);
    }
    a {
      color: var(--hl-ink);
      text-decoration: underline;
      text-decoration-color: var(--hl-muted);
      text-underline-offset: 3px;
    }
    a:hover {
      text-decoration-color: var(--hl-ink);
    }
    @keyframes pulse {
      from {
        box-shadow: 0 0 0 0 rgba(115, 191, 105, 0.6);
      }
      to {
        box-shadow: 0 0 0 8px rgba(115, 191, 105, 0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .dot {
        animation: none;
      }
    }
  `,
})
export class LiveSource {
  // When this page last got an answer, in milliseconds. Null until the first one.
  readonly updatedAt = input<number | null>(null)
  readonly failed = input(false)
  readonly details = input<string[]>([])
  readonly links = input<SourceLink[]>([])

  private readonly now = signal(Date.now())

  protected readonly status = computed(() => {
    const at = this.updatedAt()
    if (at === null)
      return this.failed() ? 'Live data is unavailable right now' : 'Connecting to the cluster'
    return `Live, updated ${ago(this.now() - at)}`
  })

  constructor() {
    const platformId = inject(PLATFORM_ID)
    const destroyRef = inject(DestroyRef)
    afterNextRender(() => {
      if (!isPlatformBrowser(platformId)) return
      const ticker = setInterval(() => this.now.set(Date.now()), 1000)
      destroyRef.onDestroy(() => clearInterval(ticker))
    })
  }
}
