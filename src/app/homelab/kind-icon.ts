import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'

// The same icons Launchpad shows for each kind, copied from its public/icons.
const ICONS: Record<string, string> = {
  Spa: 'app-window',
  Api: 'zap',
  Sql: 'database',
  NoSql: 'braces',
  ObjectStorage: 'archive',
  Cache: 'memory-stick',
  Topic: 'megaphone',
  Subscription: 'bell',
  Wordpress: 'wordpress',
  GraphApi: 'graphql',
  FederatedGraph: 'network',
  ManagedSecret: 'key-round',
  IAMRole: 'key-round',
}

// The SVG is a mask over currentColor, so each icon takes the colour of the text around it.
@Component({
  selector: 'app-kind-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: { 'aria-hidden': 'true', '[style.mask-image]': 'maskImage()' },
  styles: `
    :host {
      display: inline-block;
      width: 1em;
      height: 1em;
      vertical-align: -0.125em;
      background-color: currentColor;
      mask-position: center;
      mask-size: contain;
      mask-repeat: no-repeat;
    }
  `,
})
export class KindIcon {
  readonly kind = input.required<string>()

  protected readonly maskImage = computed(() => {
    const file = ICONS[this.kind()]
    return file ? `url(/icons/kinds/${file}.svg)` : 'none'
  })
}
