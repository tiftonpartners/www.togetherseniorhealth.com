import { TestBed } from '@angular/core/testing';

import { SessionStateService } from './session-state.service';

describe('SessionStateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SessionStateService = TestBed.get(SessionStateService);
    expect(service).toBeTruthy();
  });
});
