import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject } from '@angular/core';
import { Logger, CredentialsService } from '@app/core';
import { SessionStateService } from '@ses/sessions/session-state.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AgoraAbstractComponent } from '../agora/agora-abstract';
import { GlobalEventService } from '@app/evnt/global-events.service';
import { SessionApiService } from '../sessions/session-api.service';
import { UserApiService } from '@app/core/authentication/user-api.service';
import { Auth0Permission } from '@app/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { debounce as _debounce } from 'lodash';
import { DOCUMENT } from '@angular/common';
import { CalcSizes } from '../agora/utils/grid-size';
import { WINDOW } from '@app/core/services/window.service';
import { ControlButtonComponent } from '@app/shared/control-button/control-button.component';
import RemoteStreamInfo from '../agora/utils/meeting-user-info';
import { ClassSession } from '../sessions/class';
import { MatSnackBar } from '@angular/material';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MusicApiService } from '../sessions/music-api-service';
import { MediaService } from '@app/shared/services/media/media.service';
import { AgoraService } from '@app/shared/services/agora/agora.service';
import { AnalyticsService } from '@app/analytics/analytics.service';

const log = new Logger('AgoraGridTestComponent');

const MEETING_CLASS = 'meeting';
const MEETING_CLASS_STUDENT = `${MEETING_CLASS}--student`;

const MIN_RATIO = 9 / 16;
const VIDEO_MARGIN = 15;

@Component({
  selector: 'app-agora',
  templateUrl: './agora-test-grid.component.html',
  styleUrls: ['./agora-test-grid.component.scss']
})
export class AgoraTestGridComponent extends AgoraAbstractComponent implements OnInit, OnDestroy {
  showGlobalCommands = false;
  canMuteAll = false;
  canSetViewAll = false;
  canLogoutAll = false;
  menuOpened = false;
  askedForHelp = false;
  // The container is a div containing all videos
  @ViewChild('container', { static: true }) containerElement: ElementRef;

  @ViewChild('askForHelpButton', { static: false }) askForHelpButton: ControlButtonComponent;
  @ViewChild('askForHelpContainer', { static: false }) set content(content: ElementRef) {
    if (content) {
      this.askForHelpContainer = content;
      this.onAskForHelpChanged();
    }
  }

  private askForHelpContainer: ElementRef;

  private onPermissionsReady$: Subscription;

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
    @Inject(DOCUMENT) private _document: Document,
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

  /**
   * Override client setup so that we aren't doing any streaming
   */
  async setupClient(session: ClassSession, userId: string): Promise<boolean> {
    return true;
  }

  /*****
   * Manage the display of the streams in a Grid
   */

  async ngOnInit(callParent: boolean = true) {
    this.isAudioEnabled = true;

    this._document.body.classList.add(MEETING_CLASS);

    this.onPermissionsReady$ = this.credentialService.onPermissionsReady$.subscribe((ready: boolean) => {
      try {
        if (!ready) {
          return;
        }

        this.showGlobalCommands = this.credentialService.hasAnyPermission([
          Auth0Permission.setglobal_mute,
          Auth0Permission.setglobal_view,
          Auth0Permission.setglobal_logout
        ]);

        if (!this.showGlobalCommands) {
          this._document.body.classList.add(MEETING_CLASS_STUDENT);
        }

        this.canMuteAll = this.credentialService.hasPermission(Auth0Permission.setglobal_mute);
        this.canSetViewAll = this.credentialService.hasPermission(Auth0Permission.setglobal_view);
        this.canLogoutAll = this.credentialService.hasPermission(Auth0Permission.setglobal_logout);
      } catch (e) {}
    });

    if (this._window) {
      this.debouncedOnResize = _debounce(this._onResize.bind(this), 100);
      window.addEventListener('resize', this.debouncedOnResize);
      this.debouncedOnResize();
      this._window.onbeforeunload = () => this.ngOnDestroy();
    }

    if (callParent) {
      await super.ngOnInit();
    }
  }

  /**
   * Open or close the lef menu
   *
   */
  doToggleMenuClick() {
    this.menuOpened = !this.menuOpened;
  }
  /**
   * Refresh the current page
   *
   */
  refreshPage() {
    window.location.reload();
  }

  async ngOnDestroy() {
    super.ngOnDestroy();
    this._document.body.classList.remove(MEETING_CLASS);
    this._document.body.classList.remove(MEETING_CLASS_STUDENT);
    if (this.onPermissionsReady$) {
      this.onPermissionsReady$.unsubscribe();
    }
  }

  askForHelp() {
    this.askedForHelp = !this.askedForHelp;
  }

  onAskForHelpChanged() {
    const { element: buttonRef = null as ElementRef } = this.askForHelpButton || {};
    const { nativeElement: button = null as HTMLElement } = buttonRef || {};

    if (!this.askedForHelp || !button) {
      return;
    }

    const buttonBounding = button && button.getBoundingClientRect();
    const top = buttonBounding && buttonBounding.top;

    const desphase = 12;
    const askForHelpBounding = this.askForHelpContainer.nativeElement.getBoundingClientRect();
    const height = askForHelpBounding.height;

    const newTop = this._window.scrollY + top - (height + desphase);

    this.askForHelpContainer.nativeElement.style.top = `${newTop}px`;
  }

  /**
   * It's triggered when window resize
   */
  protected _onResize() {
    if (!this._window) {
      return;
    }

    this.onAskForHelpChanged();
    // const isInstructor = this.credentialService.isInstructor();

    const CONTAINER_PADDING = 30;
    const MENU_WIDTH = !this.isTheInstructor ? 190 : this.menuOpened ? 270 : 92;
    const windowView = {
      w: this._window.innerWidth - CONTAINER_PADDING * 2 - MENU_WIDTH,
      h: this._window.innerHeight - CONTAINER_PADDING * 2
    };

    // Count visible remote streams
    const numVideos = this.meetingUserInfos.reduce((acc: number, cv: RemoteStreamInfo) => {
      if (!cv.isHidden) {
        return acc + 1;
      } else {
        return acc;
      }
    }, 0);

    const containerElement = this.containerElement.nativeElement;
    const view = { w: containerElement.clientWidth, h: containerElement.clientHeight };
    // log.debug('(_onResize) Container Size:', view, 'window:', windowView);
    const spacing = { h: 8, v: 40 };
    const margins = { top: 0, right: 0, bottom: 32, left: 0 };
    const maxArea = CalcSizes(numVideos, 9 / 16, view, spacing, margins);
    // log.debug('(_onResize) Solution:', maxArea);

    if (maxArea) {
      // Set location + size of all remote streams
      const { w: width, h: height } = maxArea;
      log.debug(`(resizeVideos) width:${width} height:${height} videosCount:${numVideos}`);

      let i = 0;
      for (const remoteStream of this.meetingUserInfos) {
        const { top, left } = maxArea.getPosition(i);
        log.debug(`(resizeVideos) Location:`, maxArea.getLocation(i), 'Position:', { top, left });
        remoteStream.location = { top, left, width: maxArea.w, height: maxArea.h };
        i++;
      }
    }
  }
}
