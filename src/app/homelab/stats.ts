import { Injectable } from '@angular/core'

export type ClusterRange = '1d' | '1w' | '1m'

export interface ClusterStats {
  range: ClusterRange
  availability30d: number | null
  lastPowerOutage: string | null
  lastInternetOutage: string | null
  nodes: { ready: number; total: number; cores: number; memoryBytes: number }
  pods: number
  apps: { synced: number; total: number }
  timestamps: number[]
  podSeries: (number | null)[]
  perNode: {
    name: string
    role: string
    memoryBytes: number
    temperatureC: number | null
    cpu: (number | null)[]
    memory: (number | null)[]
  }[]
  network: { in: (number | null)[]; out: (number | null)[] }
  disk: { read: (number | null)[]; write: (number | null)[] }
}

export interface BuildStep {
  name: string
  kind?: string
  where: 'pi' | 'aws' | 'app'
  seconds: number
}

export interface PlatformStats {
  running: { total: number; byType: { type: string; count: number }[] }
  workspaces: {
    count: number
    averageSeconds: number
    build: { totalSeconds: number; steps: BuildStep[] }
  } | null
}

export interface AutomergeStats {
  since: string
  automatic: number
  byHand: number
  updated: string
  days: { date: string; automatic: number; byHand: number }[]
}

// Same origin, because the site's nginx forwards /api/stats/ to homelab-stats
// and the CSP only allows connect-src 'self'.
const BASE = '/api/stats'

@Injectable({ providedIn: 'root' })
export class Stats {
  cluster(range: ClusterRange): Promise<ClusterStats> {
    return get(`${BASE}/cluster?range=${range}`)
  }

  platform(): Promise<PlatformStats> {
    return get(`${BASE}/platform`)
  }

  automerge(): Promise<AutomergeStats> {
    return get(`${BASE}/automerge`)
  }
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} returned ${res.status}`)
  return (await res.json()) as T
}
