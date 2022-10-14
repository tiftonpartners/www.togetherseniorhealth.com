import { Injectable } from '@angular/core';
import { HttpService } from '@app/core/http/http.service';
import { Observable, of } from 'rxjs';
import { UserInfo } from '@app/core/authentication/user.types';
import { map } from 'rxjs/operators';

export const USER_DATA_NAMESPACE = 'https://t1.tsh.com/';

// API To get session information (for Agora only)
// Uses reactive-HTTP and JWT tokens to authenticate to the
// API.
//
// This will replace SessionService eventually
//
@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  me: UserInfo;

  constructor(private http: HttpService) {}

  getMyUser$(force: boolean = false): Observable<UserInfo> {
    if (!force && this.me) {
      return of(this.me);
    }
    return this.http.get('/api/v1/users/me').pipe(
      map(response => {
        this.me = new UserInfo(response);
        return this.me;
      })
    );
  }

  /**
   * Get user by user number
   *
   */
  getUserByNumber$(userNumber: string): Observable<UserInfo> {
    return this.getUser(userNumber, false);
  }

  /**
   * Get user by user id
   *
   */
  getUserById(userId: string): Observable<UserInfo> {
    return this.getUser(userId);
  }

  private getUser(userId: string, isById: boolean = true): Observable<UserInfo> {
    const baseUrl = isById ? '/api/v1/users/id/' : '/api/v1/users/';
    return this.http.get(`${baseUrl}${userId}`).pipe(
      map((result: { userInfo: UserInfo }) => {
        const { userInfo: { token = null, userData = null } = {} } = result;

        if (token) {
          const nameFromToken = token[`${USER_DATA_NAMESPACE}name`] ? token[`${USER_DATA_NAMESPACE}name`] : '';
          const nicknameFromToken = token[`${USER_DATA_NAMESPACE}nickname`]
            ? token[`${USER_DATA_NAMESPACE}nickname`]
            : '';
          const pictureFromToken = token[`${USER_DATA_NAMESPACE}picture`] ? token[`${USER_DATA_NAMESPACE}picture`] : '';
          const newUserData = { name: nameFromToken, nickname: nicknameFromToken, picture: pictureFromToken };
          const userObjectFromToken = Object.assign({}, result.userInfo, newUserData);
          const newUserFromToken = new UserInfo(userObjectFromToken);
          newUserFromToken.id = token.sub || '';

          return newUserFromToken;
        }

        const { name = '', nickname = '', picture = '', user_id = null } = (userData as any) || {};
        const userObject = Object.assign({}, result.userInfo, { name, nickname, picture });
        const newUser = new UserInfo(userObject);
        newUser.id = user_id;

        return newUser;
      })
    );
  }
}
