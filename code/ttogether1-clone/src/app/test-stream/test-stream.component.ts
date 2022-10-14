import { Component, OnInit, OnDestroy, Inject, ViewChild, ElementRef } from '@angular/core';
import { SessionStateService } from '@app/session/sessions/session-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CredentialsService, Logger } from '@app/core';
import { AgoraAbstractComponent } from '@app/session/agora/agora-abstract';
import { MatDialog, MatSnackBar } from '@angular/material';
import { debounce as _debounce } from 'lodash';
import { UserApiService } from '@app/core/authentication/user-api.service';
import { WINDOW } from '@app/core/services/window.service';
import { GlobalEventService } from '@app/evnt/global-events.service';
import { SessionApiService } from '@app/session/sessions/session-api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '@env/environment.prod';
import { MusicApiService } from '@app/session/sessions/music-api-service';
import { MediaService } from '@app/shared/services/media/media.service';
import { AgoraService } from '@app/shared/services/agora/agora.service';
import { AnalyticsService } from '@app/analytics/analytics.service';

const log = new Logger('TestStream');

const VIDEO_PATH = '/assets/mpg/';
export const TEST_VIDEOS: string[] = [
  'vidyo4_720p_15fps.webm',
  'vidyo4_360p_15fps.webm',
  'video-test-1.mp4',
  'video-test-2.mp4',
  'video-test-3.mp4',
  'video-test-4.mp4',
  'video-test-5.mp4',
  'video-test-6.m4v'
];

@Component({
  selector: 'test-stream',
  templateUrl: './test-stream.component.html',
  styleUrls: ['./test-stream.component.scss']
})
export class TestStreamComponent extends AgoraAbstractComponent implements OnInit, OnDestroy {
  nickname = 'UNKNOWN';
  debouncedOnResize: () => {};

  /**
   * Flag to know when the component as loaded
   */
  loaded = false;

  testVideos: string[] = TEST_VIDEOS;
  testVideosPrefix = environment.sampleVideosPrefix;

  @ViewChild('videoContainer', { static: true }) videoContainer: ElementRef;

  private _currenUserNumber = '';

  constructor(
    sessionApiService: SessionApiService,
    sessionStateService: SessionStateService,
    credentialService: CredentialsService,
    router: Router,
    activatedRoute: ActivatedRoute,
    globalEventService: GlobalEventService,
    userApiService: UserApiService,
    musicApiService: MusicApiService,
    snackBar: MatSnackBar,
    protected modalService: NgbModal,
    dialog: MatDialog,
    mediaService: MediaService,
    agoraService: AgoraService,
    analyticsService: AnalyticsService,
    @Inject(WINDOW) private _window: Window
  ) {
    super(
      sessionApiService,
      sessionStateService,
      credentialService,
      router,
      activatedRoute,
      globalEventService,
      userApiService,
      musicApiService,
      snackBar,
      modalService,
      dialog,
      mediaService,
      agoraService,
      analyticsService
    );
  }

  _onResize() {
    if (!this._window) {
      return;
    }
  }

  async ngOnInit() {
    this.debouncedOnResize = (): {} => ({});
    await super.ngOnInit();
    log.debug('(ngOnInit) Current Session:', this.currentClass.acronym);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  onVideoChange(event: Event) {
    log.debug('(onVideoChange)');
    const target = event.target as HTMLSelectElement;
    const newVideo = target.value;

    if (newVideo) {
      const newVideoPath = `${environment.sampleVideosPrefix}${newVideo}`;
      this._refreshStream(newVideoPath);
    }
  }

  private _onVideoLoad() {
    log.debug('(_onVideoLoad)');
    // if (this.localStream && this.localStream.stream) {
    //   this.localStream.stream.close();
    //   // this.client.unpublish(this.localStream.stream);
    //   this.publishLocalStreams(this._currenUserNumber, this._currenUserNumber);
    // }
  }

  private _refreshStream(newVideo: string) {
    log.debug('(_refreshStream) loading', newVideo);
    const videoElement = this.videoContainer.nativeElement as HTMLVideoElement;
    videoElement.addEventListener('loadeddata', this._onVideoLoad.bind(this));
    videoElement.src = newVideo;
    videoElement.autoplay = videoElement.loop = true;
  }
}
