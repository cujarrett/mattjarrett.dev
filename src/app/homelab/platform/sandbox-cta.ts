import { ChangeDetectionStrategy, Component } from '@angular/core'

// The invitation to build a real workspace in Launchpad.
@Component({
  selector: 'app-sandbox-cta',
  templateUrl: './sandbox-cta.html',
  styleUrl: './sandbox-cta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SandboxCta {}
