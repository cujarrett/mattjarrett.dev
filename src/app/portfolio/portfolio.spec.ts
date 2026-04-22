import { TestBed, ComponentFixture } from '@angular/core/testing';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { Portfolio } from './portfolio';

describe('Portfolio', () => {
  let fixture: ComponentFixture<Portfolio>;
  let component: Portfolio;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Portfolio],
      providers: [
        { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Portfolio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 projects', () => {
    expect(component['projects'].length).toBe(5);
  });

  it('each project should have title, description, url, and img', () => {
    for (const project of component['projects']) {
      expect(project.title).toBeTruthy();
      expect(project.description).toBeTruthy();
      expect(project.url).toMatch(/^https:\/\//);
      expect(project.img).toBeTruthy();
    }
  });

  it('should render a card for each project', () => {
    const cards = fixture.nativeElement.querySelectorAll('.portfolio-item');
    expect(cards.length).toBe(component['projects'].length);
  });
});
