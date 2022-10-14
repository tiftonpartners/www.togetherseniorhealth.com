import { Observable, of } from 'rxjs';

import { LoginContext } from './authentication.service';
import { Auth0Credentials } from './credentials.service';

export class MockAuthenticationService {
  credentials: Auth0Credentials | null = {
    username: 'test',
    token: '123'
  };

  login(context: LoginContext): Observable<Auth0Credentials> {
    return of({
      username: context.username,
      token: '123456'
    });
  }

  logout(): Observable<boolean> {
    this.credentials = null;
    return of(true);
  }
}
