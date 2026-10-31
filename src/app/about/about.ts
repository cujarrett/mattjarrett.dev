import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  PLATFORM_ID,
  afterNextRender,
  ElementRef,
  DestroyRef,
} from '@angular/core'
import { isPlatformBrowser, DOCUMENT, NgOptimizedImage } from '@angular/common'
import { Reveal } from '../shared/reveal'
import { scrollProgress } from '../homelab/charts'

interface Skill {
  name: string
  percent: number
  color: string
}

@Component({
  selector: 'app-about',
  imports: [NgOptimizedImage, Reveal],
  templateUrl: './about.html',
  styleUrl: './about.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  // How far the skill bars have scrolled up the screen, 0 to 1. The bars follow it both ways.
  protected readonly progress = signal(0)

  private readonly platformId = inject(PLATFORM_ID)
  private readonly document = inject(DOCUMENT)
  private readonly elementRef = inject(ElementRef)
  private readonly destroyRef = inject(DestroyRef)

  protected readonly certifications = [
    {
      name: 'Certified Kubernetes Application Developer (CKAD)',
      url: 'https://www.credly.com/badges/274f4c4a-ffdb-4caa-9ece-82338d7fa974',
      img: 'certified-kubernetes-application-developer.png',
    },
    {
      name: 'AWS Certified Solutions Architect – Associate',
      url: 'https://www.credly.com/badges/54ba35f8-3a60-4a9e-bc4c-de18aa47a5e4',
      img: 'aws-certified-solutions-architect–associate.png',
    },
    {
      name: 'HashiCorp Certified: Terraform Associate',
      url: 'https://www.credly.com/badges/5af85d36-e997-4591-b745-fec9283ff656',
      img: 'hashicorp-certified-terraform-associate.png',
    },
  ]

  protected readonly experience = [
    {
      title: 'Staff Engineer, Platform Engineering - State Farm',
      period: '2026 to Present',
      description: 'Working hard to build an internal developer platform that makes people smile.',
    },
    {
      title: 'Sr Software Engineer - State Farm',
      period: '2019 to 2026',
      description:
        'Led cloud native and DevOps change for the telematics platform across public cloud, mobile, and IoT, working on culture as much as code.',
    },
    {
      title: 'Software Engineer - State Farm',
      period: '2017 to 2019',
      description:
        'Built React, Node, and Kubernetes services for high priority enterprise work. Mentored teammates and taught modern JavaScript.',
    },
    {
      title: 'Software Engineer - State Farm',
      period: '2015 to 2017',
      description:
        'Built web services that give developers safe test data on demand, since then patented and used millions of times across the company.',
    },
    {
      title: 'Software Engineer - State Farm',
      period: '2011 to 2015',
      description:
        'Automated test stand up and tear down, cutting days to minutes. Taught Java, recruited on campus, and mentored interns who all went full time.',
    },
  ]

  protected readonly skills: Skill[] = [
    { name: 'AWS', percent: 50, color: '#f44336' },
    { name: 'JavaScript', percent: 90, color: '#9c27b0' },
    { name: 'Angular', percent: 15, color: '#3f51b5' },
    { name: 'Go', percent: 10, color: '#03a9f4' },
    { name: 'Kubernetes', percent: 65, color: '#009688' },
    { name: 'Terraform', percent: 60, color: '#8bc34a' },
    { name: 'IoT', percent: 50, color: '#f9a825' },
  ]

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return
      const win = this.document.defaultView
      if (!win) return
      if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.progress.set(1)
        return
      }
      const measure = () => {
        const graph: Element | null = this.elementRef.nativeElement.querySelector('#skills-graph')
        if (!graph) return
        const box = graph.getBoundingClientRect()
        this.progress.set(scrollProgress(box.top, box.height, win.innerHeight))
      }
      let queued = 0
      const queue = () => {
        queued ||= win.requestAnimationFrame(() => {
          queued = 0
          measure()
        })
      }
      win.addEventListener('scroll', queue, { passive: true })
      win.addEventListener('resize', queue)
      this.destroyRef.onDestroy(() => {
        win.removeEventListener('scroll', queue)
        win.removeEventListener('resize', queue)
        win.cancelAnimationFrame(queued)
      })
      measure()
    })
  }
}
