import { Directive, ElementRef, inject, input, PLATFORM_ID, afterNextRender } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Directive({
  selector: '[appReveal]',
})
export class Reveal {
  readonly revealDelay = input(0)

  private readonly elementRef = inject(ElementRef)
  private readonly platformId = inject(PLATFORM_ID)

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return

      const element: HTMLElement = this.elementRef.nativeElement
      const win = element.ownerDocument.defaultView
      // Without JS (or with reduced motion) content must stay visible, so the
      // hidden state is only ever applied from here, never in static CSS.
      if (!win || !('IntersectionObserver' in win)) return
      if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      element.classList.add('reveal')
      if (this.revealDelay() > 0) {
        element.style.transitionDelay = `${this.revealDelay()}ms`
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              element.classList.add('revealed')
              observer.disconnect()
            }
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
      )
      observer.observe(element)
    })
  }
}
