import { TestBed } from '@angular/core/testing';
import { Hero } from './hero';

describe('Hero', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Hero);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
