import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Nav } from './nav/nav'
import { Hero } from './hero/hero'
import { About } from './about/about'
import { Homelab } from './homelab/homelab'
import { Platform } from './homelab/platform/platform'
import { Automerge } from './homelab/automerge/automerge'
import { Portfolio } from './portfolio/portfolio'
import { Contact } from './contact/contact'

@Component({
  selector: 'app-root',
  imports: [Nav, Hero, About, Portfolio, Homelab, Platform, Automerge, Contact],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
