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
      temperature: [40, 44.1],
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

async function mount<T>(component: new () => T) {
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [{ provide: Stats, useValue: fakeStats }],
  }).compileComponents()
  const fixture = TestBed.createComponent(component)
  fixture.detectChanges()
  await fixture.whenStable()
  await new Promise((resolve) => setTimeout(resolve))
  fixture.detectChanges()
  return fixture
}

async function render<T>(component: new () => T) {
  return (await mount(component)).nativeElement as HTMLElement
}

// Puts boxes where a test says, since happy-dom has no layout. Elements not listed sit at 0.
function placeBoxes(boxes: Record<string, { top?: number; left?: number; width?: number }>) {
  return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: Element,
  ) {
    const name = Object.keys(boxes).find((cls) => this.classList.contains(cls))
    const { top = 0, left = 0, width = 0 } = name ? boxes[name] : {}
    return { top, left, width, height: 400, bottom: top + 400, right: left + width } as DOMRect
  })
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

  it('says how often a point is taken', async () => {
    const el = await render(Cluster)
    expect(el.textContent).toContain('a point every')
  })

  it('shows the number under the pointer, and the latest again once it leaves', async () => {
    const spy = placeBoxes({ area: { left: 0, width: 100 } })
    const fixture = await mount(Cluster)
    const el = fixture.nativeElement as HTMLElement
    const value = () => el.querySelector('.metric .v')?.textContent
    expect(value()).toBe('90%')

    const plot = el.querySelector('.metric .area') as HTMLElement
    plot.dispatchEvent(new MouseEvent('pointermove', { clientX: 0, bubbles: true }))
    fixture.detectChanges()
    expect(value()).toBe('20%')
    expect(el.querySelector('.metric .v')?.className).toContain('good')
    expect(el.querySelector('.temp')?.textContent).toBe('40.0°C')

    plot.dispatchEvent(new MouseEvent('pointerleave'))
    fixture.detectChanges()
    expect(value()).toBe('90%')
    expect(el.querySelector('.temp')?.textContent).toBe('44.1°C')
    spy.mockRestore()
  })
})

describe('Platform', () => {
  it('shows the running total, the replayed build time and a build still empty below the fold', async () => {
    const spy = placeBoxes({ race: { top: 5000 } })
    const el = await render(Platform)
    expect(el.querySelector('.big b')?.textContent).toBe('31')
    expect(el.textContent).toContain('GraphQL services')
    expect(el.textContent).toContain('SQL databases')
    expect(el.querySelectorAll('.big b')[1]?.textContent).toContain('41')
    expect(el.textContent).toContain('Auth and connection details included.')
    expect(el.querySelectorAll('.step.done').length).toBe(1)
    spy.mockRestore()
  })

  it('grows the build with the scroll position and empties it on the way back up', async () => {
    const spy = placeBoxes({ race: { top: 5000 } })
    const fixture = await mount(Platform)
    const el = fixture.nativeElement as HTMLElement
    // The slowest step is 41 s on a 44 s axis.
    const last = () =>
      parseFloat((el.querySelector('.step:last-child .bar') as HTMLElement).style.width)
    const scrollTo = async (top: number) => {
      spy.mockRestore()
      placeBoxes({ race: { top } })
      window.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 50))
      fixture.detectChanges()
    }

    // Half way: the chart is 400 tall, so the top sits midway between 0.9 vh and 0.35 vh - 200.
    const vh = window.innerHeight
    await scrollTo(vh * 0.625 - 100)
    expect(last()).toBeCloseTo((20.5 / 44) * 100)
    await scrollTo(-1000)
    expect(last()).toBeCloseTo((41 / 44) * 100)
    await scrollTo(5000)
    expect(last()).toBe(0)
    vi.restoreAllMocks()
  })
})

describe('Automerge', () => {
  it('shows the automatic total and one column per day', async () => {
    const el = await render(Automerge)
    expect(el.querySelector('.big b')?.textContent).toBe('311')
    expect(el.textContent).toContain('merged by hand since automerge went on')
    expect(el.querySelectorAll('.day').length).toBe(2)
    expect(el.querySelector('.live')?.getAttribute('style')).toContain('left: 50%')
  })
})
