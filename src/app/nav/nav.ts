import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  PLATFORM_ID,
  afterNextRender,
} from '@angular/core'
import { isPlatformBrowser, DOCUMENT } from '@angular/common'

@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nav {
  protected readonly menuOpen = signal(false)
  protected readonly scrolled = signal(false)

  private readonly platformId = inject(PLATFORM_ID)
  private readonly document = inject(DOCUMENT)

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        const win = this.document.defaultView
        win?.addEventListener('scroll', () => {
          this.scrolled.set((win?.scrollY ?? 0) > 100)
        })
      }
    })
  }

  protected readonly links = [
    { label: 'About', href: '#about' },
    { label: 'Portfolio', href: '#portfolio' },
  ]

  toggleMenu() {
    this.menuOpen.update((open) => !open)
  }

  closeMenu() {
    this.menuOpen.set(false)
  }

  scrollTo(event: Event, href: string) {
    event.preventDefault()
    this.closeMenu()
    const el = this.document.querySelector(href)
    if (el) {
      const top = el.getBoundingClientRect().top + (this.document.defaultView?.scrollY ?? 0) - 50
      this.document.defaultView?.scrollTo({ top, behavior: 'smooth' })
    }
  }
}
