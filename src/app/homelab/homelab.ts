import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Reveal } from '../shared/reveal'
import { Cluster } from './cluster/cluster'

@Component({
  selector: 'app-homelab',
  imports: [Reveal, Cluster],
  templateUrl: './homelab.html',
  styleUrl: './homelab.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Homelab {}
