import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common'
import { App } from './app'
import { Stats } from './homelab/stats'

// The homelab sections fetch live numbers after render. Never answering keeps
// these tests off the network.
const pending = () => new Promise<never>(() => undefined)
const offlineStats = { cluster: pending, platform: pending, automerge: pending }

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
        { provide: Stats, useValue: offlineStats },
      ],
    }).compileComponents()
  })

  it('should create', () => {
    const fixture = TestBed.createComponent(App)
    expect(fixture.componentInstance).toBeTruthy()
  })

  it('should render the nav', () => {
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('app-nav')).toBeTruthy()
  })

  it('should render the hero', () => {
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('app-hero')).toBeTruthy()
  })

  it('should render the about section', () => {
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('app-about')).toBeTruthy()
  })

  it('should render the portfolio', () => {
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('app-portfolio')).toBeTruthy()
  })

  it('should render the homelab section', () => {
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('app-homelab')).toBeTruthy()
  })

  it('should render the platform and automerge sections', () => {
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('app-platform')).toBeTruthy()
    expect(fixture.nativeElement.querySelector('app-automerge')).toBeTruthy()
  })

  it('should render the contact section', () => {
    const fixture = TestBed.createComponent(App)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('app-contact')).toBeTruthy()
  })
})
