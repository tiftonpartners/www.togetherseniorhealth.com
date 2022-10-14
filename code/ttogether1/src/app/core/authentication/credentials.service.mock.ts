import { Auth0Credentials } from './credentials.service';

export class MockCredentialsService {
  credentials: Auth0Credentials | null = {
    username: 'test',
    token: '123'
  };

  isAuthenticated(): boolean {
    return !!this.credentials;
  }

  setCredentials(credentials?: Auth0Credentials, _remember?: boolean) {
    this.credentials = credentials || null;
  }
}
