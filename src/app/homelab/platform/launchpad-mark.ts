import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core'

// Launchpad's own animated mark, copied from its launchpad-mark.ts.
// Sized by the parent through --mark-size.
// Draws itself when scrolled into view, and again on replay().
@Component({
  selector: 'app-launchpad-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 80 64" role="img" aria-label="Launchpad" [class.animate]="animate()">
      <g class="bracket">
        <path d="M27 10 H14 V54 H27" />
        <path d="M53 10 H66 V54 H53" />
      </g>
      <g class="arrow">
        <path d="M40 16.5 L53.5 32 H26.5 Z" />
        <rect x="35.5" y="29" width="9" height="22" rx="4.5" />
      </g>
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }
      svg {
        width: var(--mark-size, 2.25rem);
        height: auto;
      }
      .bracket path {
        fill: none;
        stroke: var(--mark-bracket, #6366f1);
        stroke-width: 6;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .arrow {
        fill: var(--mark-arrow, #c7d2fe);
      }

      /* Brackets draw themselves, then the payload lifts into the gap. */
      .animate .bracket path {
        stroke-dasharray: 120;
        animation: mark-draw 0.55s cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      .animate .bracket path:last-child {
        animation-delay: 0.08s;
      }
      .animate .arrow {
        animation: mark-rise 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) 0.4s both;
      }
      @keyframes mark-draw {
        from {
          stroke-dashoffset: 120;
        }
        to {
          stroke-dashoffset: 0;
        }
      }
      @keyframes mark-rise {
        from {
          transform: translateY(14px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .animate .bracket path,
        .animate .arrow {
          animation: none;
          stroke-dashoffset: 0;
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class LaunchpadMark {
  private readonly host = inject(ElementRef)
  protected readonly animate = signal(false)

  constructor() {
    afterNextRender(() => {
      const el: HTMLElement = this.host.nativeElement
      const win = el.ownerDocument.defaultView
      if (!win || !('IntersectionObserver' in win)) return this.animate.set(true)
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer.disconnect()
        this.animate.set(true)
      })
      observer.observe(el)
    })
  }

  // Off for one frame, so the browser restarts the animation.
  replay() {
    this.animate.set(false)
    requestAnimationFrame(() => requestAnimationFrame(() => this.animate.set(true)))
  }
}
