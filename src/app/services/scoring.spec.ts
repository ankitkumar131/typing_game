import { TestBed } from '@angular/core/testing';

import { Scoring } from './scoring';

describe('Scoring', () => {
  let service: Scoring;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Scoring);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
