import { TestBed } from '@angular/core/testing';

import { Promotoras } from './promotoras';

describe('Promotoras', () => {
  let service: Promotoras;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Promotoras);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
