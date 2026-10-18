import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core'
import { DOCUMENT } from '@angular/common'

@Component({
  selector: 'app-nav',
  imports: [],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nav {
  protected readonly menuOpen = signal(false)

  private readonly document = inject(DOCUMENT)

  protected readonly links = [
    { label: 'About', href: '#about' },
    { label: 'Homelab', href: '#homelab' },
    { label: 'Platform', href: '#platform' },
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
      const top = el.getBoundingClientRect().top + (this.document.defaultView?.scrollY ?? 0)
      this.document.defaultView?.scrollTo({ top, behavior: 'smooth' })
    }
  }
}
