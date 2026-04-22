import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Nav } from './nav';

describe('Nav', () => {
  let fixture: ComponentFixture<Nav>;
  let component: Nav;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nav],
    }).compileComponents();

    fixture = TestBed.createComponent(Nav);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have menuOpen as false by default', () => {
    expect(component['menuOpen']()).toBeFalse();
  });

  it('should have scrolled as false by default', () => {
    expect(component['scrolled']()).toBeFalse();
  });

  it('should have the expected nav links', () => {
    expect(component['links']).toEqual([
      { label: 'About', href: '#about' },
      { label: 'Portfolio', href: '#portfolio' },
    ]);
  });

  it('toggleMenu() should open the menu', () => {
    component.toggleMenu();
    expect(component['menuOpen']()).toBeTrue();
  });

  it('toggleMenu() called twice should close the menu', () => {
    component.toggleMenu();
    component.toggleMenu();
    expect(component['menuOpen']()).toBeFalse();
  });

  it('closeMenu() should close an open menu', () => {
    component.toggleMenu();
    component.closeMenu();
    expect(component['menuOpen']()).toBeFalse();
  });

  it('closeMenu() should be a no-op when menu is already closed', () => {
    component.closeMenu();
    expect(component['menuOpen']()).toBeFalse();
  });

  it('scrollTo() should call event.preventDefault()', () => {
    const event = new Event('click');
    spyOn(event, 'preventDefault');
    component.scrollTo(event, '#about');
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('scrollTo() should close the menu', () => {
    component.toggleMenu();
    component.scrollTo(new Event('click'), '#about');
    expect(component['menuOpen']()).toBeFalse();
  });

  it('should reflect menuOpen state in the nav toggle aria-expanded attribute', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.nav-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    component.toggleMenu();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('should apply the open class to nav-links when menu is open', () => {
    const navLinks: HTMLElement = fixture.nativeElement.querySelector('.nav-links');
    expect(navLinks.classList.contains('open')).toBeFalse();
    component.toggleMenu();
    fixture.detectChanges();
    expect(navLinks.classList.contains('open')).toBeTrue();
  });
});
