import { Injectable } from '@angular/core';
import { HttpService } from '@app/core/http/http.service';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AdhocSession } from './session';
import { ClassObject, ClassSession } from './class';
import { Logger, I18nService, untilDestroyed } from '@app/core';

const log = new Logger('SessionApiService');
// A Session is short for "class session", and corresponds to an
// Agora channel.  This is stored directly in MongoDB

export interface IAgoraSession {
  room: any;
  token: string;
  userNumber: number;
}

/**
 * API To get session information (for Agora only).
 * Uses reactive-HTTP and JWT tokens to authenticate to the API
 *
 */
@Injectable({
  providedIn: 'root'
})
export class SessionApiService {
  constructor(private http: HttpService) {}

  /**
   * Get a specific class session.  Actually returns the class with the session
   * as a nested document.
   *
   * @param acronym Acronym for the session
   */
  getSession$(acronym: string): Observable<ClassObject> {
    return this.http.get<ClassObject>(`/api/v1/classes/session/acronym/${acronym}`).pipe(
      map((response: any) => {
        return new ClassObject(response);
      })
    );
  }

  /**
   * Get a specific Adhoc session.  Actually returns a class object with the session
   * as a nested document.
   *
   * @param acronym Acronym for the session
   */
  getAdhocSession$(acronym: string): Observable<ClassObject> {
    return this.http.get<ClassObject>(`/api/v1/adhoc-sessions/${acronym}`).pipe(
      map((session: any) => {
        return ClassObject.NewFromAdHocSession(session);
      })
    );
  }

  /**
   * Get a class OR adhoc session given its acronym.
   *
   * @param acronym Acronym for the session
   */
  getGenericSession$(acronym: string): Observable<ClassObject> {
    return this.getSession$(acronym).pipe(
      catchError(err => {
        return this.getAdhocSession$(acronym);
      })
    );
  }

  /**
   * Get Agora session token for the current user.  The response includes a token, which is used to
   * authenticate to Agora, and userNumber, which is the user number that identifies
   * the user to Agora
   *
   * @param session
   */
  getAgoraSessionToken$(sessionAcronym: string): Observable<IAgoraSession> {
    return this.http.get<IAgoraSession>(`/api/v1/video/agora/token/${sessionAcronym}`);
  }

  /**
   * Get Agora session token.  The response includes a token, which is used to
   * authenticate to Agora, and userNumber, which is the user number that identifies
   * the user to Agora
   *
   * @param session
   */
  getAgoraSessionTokenForUser$(sessionAcronym: string, userNumber: number): Observable<IAgoraSession> {
    return this.http.get<IAgoraSession>(`/api/v1/video/agora/token/${sessionAcronym}/${userNumber}`);
  }

  /**
   * Get Agora session token. for an adhoc session.  The response includes a token, which is used to
   * authenticate to Agora, and userNumber, which is the user number that identifies
   * the user to Agora
   *
   * @param session
   */
  getAgoraAdhocSessionToken$(sessionAcronym: string): Observable<IAgoraSession> {
    return this.http.get<IAgoraSession>(`/api/v1/video/agora/adhoc-token/${sessionAcronym}`);
  }

  /**
   * Get upcoming sessions for the current user.  Actually returns a list of
   * Class objects with the nested session(s).
   *
   * @param forceDate Override current date/time for testing, in 8601 Format,
   *    for example '2020-10-07T00:00:00.000Z'
   */
  getUpcoming(forceDate?: string): Observable<ClassObject[]> {
    const date = forceDate || '';
    const forceDateParam = forceDate ? `?forceTime=${date}` : '';
    return this.http.get<ClassObject[]>(`/api/v1/classes/me/upcoming${forceDateParam}`).pipe(
      map((response: ClassObject[]) => {
        if (response && response.length) {
          return response.map(classObject => {
            return new ClassObject(classObject);
          });
        }
        return [];
      })
    );
  }

  /**
   * Get adhoc sessions for the current user.
   *
   * @param forceDate Override current date/time for testing, in 8601 Format,
   *    for example '2020-10-07T00:00:00.000Z'
   */
  getUpcomingAdHoc(forceDate?: string): Observable<AdhocSession[]> {
    const date = forceDate || '';
    const forceDateParam = forceDate ? `?forceTime=${date}` : '';
    return this.http.get<AdhocSession[]>(`/api/v1/adhoc-sessions/upcoming/me${forceDateParam}`).pipe(
      map((response: AdhocSession[]) => {
        if (response && response.length) {
          return response.map(sessionJson => {
            const s = new AdhocSession(sessionJson);
            return s;
          });
        }
        return [];
      })
    );
  }
}
