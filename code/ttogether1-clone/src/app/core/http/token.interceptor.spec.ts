import { TestBed } from '@angular/core/testing';

import { TokenInterceptor } from '@app/core/http/token.interceptor';

describe('TokenInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TokenInterceptor = TestBed.get(TokenInterceptor);
    expect(service).toBeTruthy();
  });
});
