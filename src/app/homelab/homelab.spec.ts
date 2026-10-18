import { TestBed } from '@angular/core/testing'
import { AutomergeStats, ClusterStats, PlatformStats, Stats } from './stats'
import { Cluster } from './cluster/cluster'
import { Platform } from './platform/platform'
import { Automerge } from './automerge/automerge'
import { Homelab } from './homelab'

const cluster: ClusterStats = {
  range: '1d',
  availability30d: 99.9918,
  lastPowerOutage: '2026-09-19',
  lastInternetOutage: null,
  nodes: { ready: 4, total: 4, cores: 16, memoryBytes: 42_366_386_176 },
  pods: 145,
  apps: { synced: 45, total: 45 },
  timestamps: [1, 2],
  podSeries: [144, 145],
  perNode: [
    {
      name: 'ctrl-1',
      role: 'control-plane',
      memoryBytes: 17_002_577_920,
      temperatureC: 44.1,
      cpu: [20, 90],
      memory: [57, 58],
    },
  ],
  network: { in: [1, 1_300_000], out: [1, 1_400_000] },
  disk: { read: [null, 304_000], write: [1, 1_500_000] },
}

const platform: PlatformStats = {
  running: {
    total: 31,
    byType: [
      { type: 'Api', count: 10 },
      { type: 'GraphApi', count: 4 },
    ],
  },
  workspaces: {
    count: 30,
    averageSeconds: 39.8,
    build: {
      totalSeconds: 41,
      steps: [
        { name: 'Cache', where: 'pi', seconds: 0 },
        { name: 'API running', where: 'app', seconds: 41 },
      ],
    },
  },
}

const automerge: AutomergeStats = {
  since: '2026-09-06',
  automatic: 311,
  byHand: 33,
  updated: '2026-10-18T17:16:51Z',
  days: [
    { date: '2026-09-05', automatic: 0, byHand: 9 },
    { date: '2026-09-06', automatic: 10, byHand: 12 },
  ],
}

const fakeStats = {
  cluster: () => Promise.resolve({ data: cluster, at: Date.now() }),
  platform: () => Promise.resolve({ data: platform, at: Date.now() }),
  automerge: () => Promise.resolve({ data: automerge, at: Date.now() }),
}

async function render<T>(component: new () => T) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [{ provide: Stats, useValue: fakeStats }],
  }).compileComponents()
  const fixture = TestBed.createComponent(component)
  fixture.detectChanges()
  await fixture.whenStable()
  await new Promise((resolve) => setTimeout(resolve))
  fixture.detectChanges()
  return fixture.nativeElement as HTMLElement
}

describe('Homelab', () => {
  it('renders the section with the cluster in it', async () => {
    const el = await render(Homelab)
    expect(el.querySelector('#homelab h1')?.textContent).toContain(
      'My Bookshelf Kubernetes Homelab',
    )
    expect(el.querySelector('app-cluster')).toBeTruthy()
  })
})

describe('Cluster', () => {
  it('shows availability to four places and the outage streaks', async () => {
    const el = await render(Cluster)
    const values = [...el.querySelectorAll('.stat .value')].map((v) => v.textContent?.trim())
    expect(values[0]).toBe('99.9918%')
    expect(values[2]).toBe('90+days')
    expect(values[1]).toMatch(/^\d+days?$/)
  })

  it('colours a busy node by the dashboard thresholds', async () => {
    const el = await render(Cluster)
    expect(el.querySelector('.metric .v')?.className).toContain('crit')
    expect(el.textContent).toContain('Control, 16 GB')
  })
})

describe('Platform', () => {
  it('shows the running total, the average and a build waiting to replay', async () => {
    const el = await render(Platform)
    expect(el.querySelector('.big b')?.textContent).toBe('31')
    expect(el.textContent).toContain('GraphQL services')
    expect(el.textContent).toContain('40')
    expect(el.querySelectorAll('.step.done').length).toBe(1)
    expect(el.querySelector('.clock')?.textContent).toContain('0.0')
  })
})

describe('Automerge', () => {
  it('shows the automatic total and one column per day', async () => {
    const el = await render(Automerge)
    expect(el.querySelector('.big b')?.textContent).toBe('311')
    expect(el.textContent).toContain('since Sep 6')
    expect(el.querySelectorAll('.day').length).toBe(2)
    expect(el.querySelector('.live')?.getAttribute('style')).toContain('left: 50%')
  })
})
