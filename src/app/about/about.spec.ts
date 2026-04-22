import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { About } from './about';

describe('About', () => {
  let fixture: ComponentFixture<About>;
  let component: About;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [
        { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have barsAnimated as false by default', () => {
    expect(component['barsAnimated']()).toBeFalse();
  });

  it('should have 3 certifications', () => {
    expect(component['certifications'].length).toBe(3);
  });

  it('each certification should have name, url, and img', () => {
    for (const cert of component['certifications']) {
      expect(cert.name).toBeTruthy();
      expect(cert.url).toMatch(/^https:\/\//);
      expect(cert.img).toBeTruthy();
    }
  });

  it('should have experience entries', () => {
    expect(component['experience'].length).toBeGreaterThan(0);
  });

  it('each experience entry should have title, period, and description', () => {
    for (const entry of component['experience']) {
      expect(entry.title).toBeTruthy();
      expect(entry.period).toBeTruthy();
      expect(entry.description).toBeTruthy();
    }
  });

  it('should have skills defined', () => {
    expect(component['skills'].length).toBeGreaterThan(0);
  });

  it('each skill should have name, percent, and color', () => {
    for (const skill of component['skills']) {
      expect(skill.name).toBeTruthy();
      expect(skill.percent).toBeGreaterThan(0);
      expect(skill.percent).toBeLessThanOrEqual(100);
      expect(skill.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
