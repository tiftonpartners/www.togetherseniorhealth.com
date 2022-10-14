import { Injectable } from '@angular/core';
import { HttpService } from '@app/core/http/http.service';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AdhocSession } from './session';
import { ClassObject, ClassSession } from './class';
import { Logger, I18nService, untilDestroyed } from '@app/core';

const log = new Logger('MusicApiService');

export class ClassMusicFile {
  fileName = '';
  title = '';
  ext = '';
  size = 0;
  expireTime = ''; // Expiration time for the signedURI, ISO 8601
  signedURI = '';
  unsignedURI = '';

  /**
   * Construct Music file object from JSON object returned from API
   */
  constructor(musicFileInfo: any) {
    Object.assign(this, { ...musicFileInfo });
  }
}

/**
 * Service To get list of music files from API
 */
@Injectable({
  providedIn: 'root'
})
export class MusicApiService {
  constructor(private http: HttpService) {}

  getMusicFiles(): Observable<ClassMusicFile[]> {
    return this.http.get<ClassMusicFile[]>(`/api/v1/music/files`).pipe(
      map((response: ClassMusicFile[]) => {
        if (response && response.length) {
          return response.map(musicFileObject => {
            return new ClassMusicFile(musicFileObject);
          });
        }
        return [];
      })
    );
  }
}
