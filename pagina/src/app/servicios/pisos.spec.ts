import { TestBed } from '@angular/core/testing';

import { Pisos } from './pisos';

describe('Pisos', () => {
  let service: Pisos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pisos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
