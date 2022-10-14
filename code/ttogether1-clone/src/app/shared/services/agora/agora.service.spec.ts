import { TestBed } from '@angular/core/testing';

import { AgoraService } from './agora.service';

describe('AgoraService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AgoraService = TestBed.get(AgoraService);
    expect(service).toBeTruthy();
  });
});
