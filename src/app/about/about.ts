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
      title: 'Sr Software Engineer - State Farm',
      period: '2020 to Present',
      description:
        "Advancing Cloud Native and DevOps transformations in the telematics platform space. Working with an exciting mix of technology including public cloud, mobile, and IoT. Pushing what's possible with measuing risk and adding customer value. Working daily on not only technology but also culture.",
    },
    {
      title: 'Software Engineer - State Farm',
      period: '2017 to 2019',
      description:
        'Built new solutions using React, Node, NOSQL, REST, Kubernetes, GitLab, CI/CD, Grafana, and Prometheus for enablement of large high priority enterprise initiatives. Mentored several team members in modern technology. Designed solutions for implementation. Taught classes on modern JavaScript.',
    },
    {
      title: 'Software Engineer - State Farm',
      period: '2015 to 2017',
      description:
        "Designed and implemented many successful web services allowing developers on demand access to safe fabricated data for a variety of needs and automation. It's since been used millions of times across the enterprise, enabling development teams to focus on improving customer experience.",
    },
    {
      title: 'Software Engineer - State Farm',
      period: '2011 to 2015',
      description:
        'Designed and implemented an automated infrastructure solution offering a complete stand up and tear down process accomplished in minutes compared to days. Taught Java in Enterprise Java classes to spread knowledge. Active member of the college recruitment team including creation of campus events, hacks, and interviews. Mentored many college interns through a successful internships resulting in all receiving and accepting full time positions. Designed and implemented multiple solutions in Java.',
    },
  ]

  protected readonly skills: Skill[] = [
    { name: 'AWS', percent: 50, color: '#f44336' },
    { name: 'JavaScript', percent: 90, color: '#9c27b0' },
    { name: 'Angular', percent: 15, color: '#3f51b5' },
    { name: 'Go', percent: 30, color: '#03a9f4' },
    { name: 'Kubernetes', percent: 80, color: '#009688' },
    { name: 'Terraform', percent: 75, color: '#8bc34a' },
    { name: 'Python', percent: 40, color: '#ffeb3b' },
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
