import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { PlatformStats, Stats } from '../stats'
import { Reveal } from '../../shared/reveal'
import { KindIcon } from '../kind-icon'
import { LiveSource } from '../live-source'
import { SandboxCta } from './sandbox-cta'
import { LaunchpadMark } from './launchpad-mark'

const PLATFORM_REPO = 'https://github.com/cujarrett/homelab/tree/main/platform/'

// dir: the kind's folder under platform/ in the homelab repo.
// tech: the product the platform hides behind the kind, shown small beside its name.
const TYPES: Record<string, { name: string; dir: string; tech?: string }> = {
  Api: { name: 'APIs', dir: 'api' },
  Spa: { name: 'Web apps', dir: 'spa' },
  GraphApi: { name: 'GraphQL services', dir: 'graph-api', tech: 'Apollo' },
  ManagedSecret: { name: 'Secrets', dir: 'managed-secret', tech: 'AWS Secrets Manager' },
  Wordpress: { name: 'WordPress sites', dir: 'wordpress' },
  FederatedGraph: { name: 'Federated graphs', dir: 'federated-graph', tech: 'Apollo' },
  Cache: { name: 'Caches', dir: 'cache', tech: 'Redis or ElastiCache' },
  NoSql: { name: 'NoSQL tables', dir: 'nosql', tech: 'DynamoDB' },
  Topic: { name: 'Event topics', dir: 'topic', tech: 'NATS' },
  Subscription: { name: 'Subscriptions', dir: 'subscription', tech: 'NATS' },
  Sql: { name: 'SQL databases', dir: 'sql', tech: 'Postgres or RDS' },
  ObjectStorage: { name: 'Storage buckets', dir: 'object-storage', tech: 'S3' },
  WorkflowSpace: { name: 'Durable workflows', dir: 'workflow-space', tech: 'Temporal' },
}

// Both have an in-cluster variant and an AWS one, chosen by the developer.
const HAS_VARIANTS = new Set(['Cache', 'Sql'])

@Component({
  selector: 'app-platform',
  imports: [Reveal, KindIcon, LiveSource, SandboxCta, LaunchpadMark],
  templateUrl: './platform.html',
  styleUrl: './platform.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Platform {
  private readonly stats = inject(Stats)
  private readonly platformId = inject(PLATFORM_ID)
  private readonly host = inject(ElementRef<HTMLElement>)
  private readonly destroyRef = inject(DestroyRef)

  protected readonly data = signal<PlatformStats | null>(null)
  protected readonly failed = signal(false)
  protected readonly updatedAt = signal<number | null>(null)

  protected readonly types = computed(() => {
    const running = this.data()?.running.byType ?? []
    if (running.length === 0) return []
    // The API leaves out kinds with nothing running, so these two are added back at zero.
    // Both are offered in two places, and a missing row would hide that.
    const missing = [...HAS_VARIANTS]
      .filter((type) => !running.some((r) => r.type === type))
      .map((type) => ({ type, count: 0 }))
    return [...running, ...missing].map((r) => ({
      type: r.type,
      name: TYPES[r.type]?.name ?? r.type,
      // A kind missing from the list links to the platform folder itself.
      href: PLATFORM_REPO + (TYPES[r.type]?.dir ?? ''),
      count: r.count,
      tech: TYPES[r.type]?.tech,
    }))
  })

  protected readonly build = computed(() => {
    const ws = this.data()?.workspaces
    if (!ws) return null
    // One list of rollout times per kind. The WorkflowSpace build adds the kinds the main
    // build lacks, and the main build keeps its own times.
    // A workflow is usable once its servers have signed in, so its row shows that whole
    // build, the time a guest waits, not the moment its namespace exists.
    const flow = ws.workflowBuild
    const names = new Set(ws.build.steps.map((s) => s.name))
    const extra = (flow?.steps ?? [])
      .filter((s) => !names.has(s.name))
      .map((s) => (s.kind === 'WorkflowSpace' ? { ...s, seconds: flow!.totalSeconds } : s))
    // The API and web app resources are ready in seconds. Their "running" rows are the
    // time that counts, so only those show.
    const resourceOnly = (s: { kind?: string; where: string }) =>
      (s.kind === 'Api' || s.kind === 'Spa') && s.where !== 'app'
    const steps = [...ws.build.steps, ...extra]
      .filter((s) => !resourceOnly(s))
      .sort((a, b) => a.seconds - b.seconds)
    // The replay runs until the slowest row, which can be the workflow.
    const total = Math.max(...steps.map((s) => s.seconds))
    // Scaled to the build itself, so the slowest step fills the row.
    const max = Math.max(4, Math.ceil(total / 4) * 4)
    return {
      total,
      max,
      ticks: [0, max / 4, max / 2, (3 * max) / 4, max],
      hasEntra: steps.some((s) => s.where === 'entra'),
      steps: steps.map((s) => {
        // A sub-second step still gets a bar wide enough to see.
        const shown = Math.max(s.seconds, 0.6)
        return {
          ...s,
          label: s.seconds < 1 ? '<1 s' : `${Math.round(s.seconds)} s`,
          shown,
          width: (shown / max) * 100,
        }
      }),
    }
  })

  constructor() {
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) return
      await this.load()
      // Refreshes each minute while the tab is open, so the running count stays live.
      const doc = this.host.nativeElement.ownerDocument
      const ticker = setInterval(() => {
        if (doc.visibilityState === 'visible') this.load()
      }, 60_000)
      this.destroyRef.onDestroy(() => clearInterval(ticker))
    })
  }

  private async load() {
    try {
      const { data, at } = await this.stats.platform()
      this.data.set(data)
      this.updatedAt.set(at)
      this.failed.set(false)
    } catch {
      this.failed.set(true)
    }
  }
}
