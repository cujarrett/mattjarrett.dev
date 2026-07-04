import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import { Reveal } from '../shared/reveal'

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

@Component({
  selector: 'app-portfolio',
  imports: [NgOptimizedImage, Reveal],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portfolio {
  protected readonly projects = shuffle([
    {
      title: 'js-pollock',
      description: 'Can computers make art? My daughter asked, so we found out',
      url: 'https://jspollock.mattjarrett.dev',
      img: 'portfolio/js-pollock.png',
    },
    {
      title: 'Destiny Insights',
      description: 'Node Twitter bot w/ 70k users',
      url: 'https://twitter.com/destinyinsights',
      img: 'portfolio/destiny-insights.png',
    },
    {
      title: 'Homelab',
      description: 'Bookshelf Kubernetes cluster',
      url: 'https://blog.mattjarrett.dev/homelab/',
      img: 'portfolio/k3s-homelab.png',
    },
    {
      title: 'ES6 in Six Hours',
      description: 'Learn ES6 in Six One Hour Sessions',
      url: 'https://github.com/cujarrett/es6-in-six-hours',
      img: 'portfolio/es6-in-six-hours.png',
    },
    {
      title: 'markdown-tables',
      description: 'Helping the world move Excel table data into Markdown tables',
      url: 'https://github.com/cujarrett/markdown-tables',
      img: 'portfolio/markdown-tables.png',
    },
    {
      title: 'my-vinyl',
      description: 'Discogs vinyl collection search, defaults to my collection',
      url: 'https://myvinyl.mattjarrett.dev',
      img: 'portfolio/my-vinyl.png',
    },
    {
      title: "I Pub Sub'd my Sump Pump",
      description: 'Power of platform engineering',
      url: 'https://blog.mattjarrett.dev/i-pub-subd-my-sump-pump/',
      img: 'portfolio/pub-sub-sump-pump.png',
    },
    {
      title: 'Velvet Rope',
      description:
        'About npm supply chain age gate — blocks packages published less than N days ago',
      url: 'https://github.com/cujarrett/velvet-rope',
      img: 'portfolio/velvet-rope.png',
    },
    {
      title: 'My Bookshelf Developer Platform',
      description: 'Learning Platform Engineering',
      url: 'https://blog.mattjarrett.dev/platform/',
      img: 'portfolio/platform.png',
    },
  ])
}
