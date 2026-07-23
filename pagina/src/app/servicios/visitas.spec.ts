import { TestBed } from '@angular/core/testing';

import { Visitas } from './visitas';

describe('Visitas', () => {
  let service: Visitas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Visitas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
