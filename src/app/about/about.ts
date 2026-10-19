import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  PLATFORM_ID,
  afterNextRender,
  ElementRef,
} from '@angular/core'
import { isPlatformBrowser, DOCUMENT, NgOptimizedImage } from '@angular/common'
import { Reveal } from '../shared/reveal'

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
  protected readonly barsAnimated = signal(false)

  private readonly platformId = inject(PLATFORM_ID)
  private readonly document = inject(DOCUMENT)
  private readonly elementRef = inject(ElementRef)

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
      period: '2020 to 2026',
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
    { name: 'Python', percent: 35, color: '#f9a825' },
  ]

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        const win = this.document.defaultView
        const checkScroll = () => {
          if (this.barsAnimated()) return
          const skillsEl = this.elementRef.nativeElement.querySelector('#skills-graph')
          if (skillsEl) {
            const rect = skillsEl.getBoundingClientRect()
            const viewHeight = win?.innerHeight ?? 0
            if (rect.top < viewHeight && rect.bottom > 0) {
              // Defer by one frame so the browser commits the 0% state first,
              // giving the CSS transition a "from" value to animate from.
              win?.requestAnimationFrame(() => {
                this.barsAnimated.set(true)
              })
            }
          }
        }
        win?.addEventListener('scroll', checkScroll)
        checkScroll()
      }
    })
  }
}
