import { TestBed } from '@angular/core/testing';

import { Word } from './word';

describe('Word', () => {
  let service: Word;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Word);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
