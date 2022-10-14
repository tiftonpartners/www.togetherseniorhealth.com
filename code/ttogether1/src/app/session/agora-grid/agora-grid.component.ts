import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject, TemplateRef, HostListener } from '@angular/core';
import { environment } from '@env/environment';
import { Logger, Auth0Service, CredentialsService, VIDEO_CELL_RATIO } from '@app/core';
import { SessionStateService } from '@ses/sessions/session-state.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AgoraAbstractComponent } from '../agora/agora-abstract';
import { GlobalEventService } from '@app/evnt/global-events.service';
import { SessionApiService } from '../sessions/session-api.service';
import { UserApiService } from '@app/core/authentication/user-api.service';
import { Subject, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { debounce as _debounce } from 'lodash';
import { DOCUMENT } from '@angular/common';
import { CalcSizes } from '../agora/utils/grid-size';
import { WINDOW } from '@app/core/services/window.service';
import { ControlButtonComponent } from '@app/shared/control-button/control-button.component';
import { ANY_SUBJECT, EMusicEvent, EventClass, EventType, GlobalEvent } from '@app/evnt/global-events';
import { MatSnackBar } from '@angular/material';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MusicApiService } from '../sessions/music-api-service';
import { MediaService } from '@app/shared/services/media/media.service';
import { AgoraService } from '@app/shared/services/agora/agora.service';
import { AnalyticsService } from '@app/analytics/analytics.service';
import { LogLevel } from '@app/shared/services/agora/agora.types';

const log = new Logger('AgoraGridComponent');

const MEETING_CLASS = 'meeting';
const MEETING_CLASS_STUDENT = `${MEETING_CLASS}--student`;

// const MIN_RATIO = 9 / 16;
// const VIDEO_MARGIN = 15;

@Component({
  selector: 'app-agora',
  templateUrl: './agora-grid.component.html',
  styleUrls: ['./agora-grid.component.scss']
})
export class AgoraGridComponent extends AgoraAbstractComponent implements OnInit, OnDestroy {
  @ViewChild('askForHelpContainer', { static: false }) set content(content: ElementRef) {
    if (content) {
      this.askForHelpContainer = content;
      this.onAskForHelpChanged('ViewChild');
    }
  }
  showGlobalCommands = false;
  canMuteAll = false;
  canSetViewAll = false;
  canLogoutAll = false;
  menuOpened = false;
  // The container is a div containing all videos
  @ViewChild('container', { static: true }) containerElement: ElementRef;

  @ViewChild('askForHelpButton', { static: false }) askForHelpButton: ControlButtonComponent;

  // The AV Controls template for the av settings modal and
  // associated state variables
  @ViewChild('avcontrols', { static: true }) public avModal: TemplateRef<any>;
  public agoraDebug = false;
  public videoStats = false;
  public musicVolume = environment.playMusicVolume;
  version: string | null = environment.version;
  timeStamp = environment.timeStamp;

  // The Leave class Modal and associated variables
  @ViewChild('leaveconfirm', { static: true }) public leaveConfirmModal: TemplateRef<any>;

  commandEventSource$ = new Subject<GlobalEvent>();
  // tslint:disable-next-line: member-ordering
  commandEvent$ = this.commandEventSource$.asObservable();

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
    this.globalEventService.listenTo(this.commandEvent$);
  }

  /*****
   * Manage the display of the streams in a Grid
   */

  async ngOnInit(callParent: boolean = true) {
    log.debug('(modal) Start', this.avModal);
    this.isAudioEnabled = true;

    this._document.body.classList.add(MEETING_CLASS);

    if (this._window) {
      this.debouncedOnResize = _debounce(this._onResize.bind(this), 100);
      window.addEventListener('resize', this.debouncedOnResize);
      this.debouncedOnResize();
      this._window.onbeforeunload = () => this.ngOnDestroy();
    }

    if (callParent) {
      await super.ngOnInit();
    }

    this.isTheInstructor = this.currentClass.firstSession.instructorId === this._currentUserId;
    this.showGlobalCommands = this.isTheInstructor;
    this.canMuteAll = this.isTheInstructor;
    this.canSetViewAll = this.isTheInstructor;
    this.canLogoutAll = this.isTheInstructor;
    if (!this.showGlobalCommands) {
      this._document.body.classList.add(MEETING_CLASS_STUDENT);
    }

    log.debug('(stats) Stats Display Config:', JSON.stringify(environment.statsDisplay));
    // For instructors, turn on the video stats by default
    if (this.isTheInstructor && environment.statsDisplay.defaultForInst) {
      const evt = new GlobalEvent(EventClass.Command, EventType.ShowStats);
      this.videoStats = true;
      evt.subject = ANY_SUBJECT;
      evt.target = 'on';
      this.commandEventSource$.next(evt);
      log.debug('(stats) turning stats ON by default for the instructor');
    }

    log.debug('(ngOnInit) showGlobalCommands:', this.showGlobalCommands, this._currentUserId);
  }

  /**
   * Open or close the lef menu
   *
   */
  doToggleMenuClick() {
    this.menuOpened = !this.menuOpened;
    this._onResize();
  }

  async ngOnDestroy() {
    super.ngOnDestroy();

    /**
     * This is to make sure the steam for audio particularly the music is deactivated to avoid
     * multiple track playing when playing music
     */
    this.stopMusic();

    this._document.body.classList.remove(MEETING_CLASS);
    this._document.body.classList.remove(MEETING_CLASS_STUDENT);
    if (this.onPermissionsReady$) {
      this.onPermissionsReady$.unsubscribe();
    }
  }

  /**
   * @description handles the stopping the music audio stream
   */
  stopMusic() {
    const globalEvent = new GlobalEvent(EventClass.Command, EventType.Music);
    globalEvent.subject = ANY_SUBJECT;
    globalEvent.target = EMusicEvent.STOP;
    globalEvent.sessionId = this.sessionStateService.sessionAcronym;
    this.mediaChangedSource$.next(globalEvent);
  }

  onAskForHelpChanged(comment?: string) {
    super.onAskForHelpChanged();
    const { element: buttonRef = null as ElementRef } = this.askForHelpButton || {};
    const { nativeElement: button = null as HTMLElement } = buttonRef || {};

    if (!this.askedForHelp || !button) {
      return;
    }

    const buttonBounding = button && button.getBoundingClientRect();
    const top = buttonBounding && buttonBounding.top;

    const desphase = 12;
    if (this.askForHelpContainer) {
      const askForHelpBounding = this.askForHelpContainer.nativeElement.getBoundingClientRect();
      const height = askForHelpBounding.height;
      const newTop = this._window.scrollY + top - (height + desphase);
      this.askForHelpContainer.nativeElement.style.top = `${newTop}px`;
    }
  }

  /**
   * Listener for key events.
   * This is used to implement any shortcuts while in the session.
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.altKey || event.metaKey) && event.ctrlKey && event.code === 'KeyS') {
      log.debug('(handleKeyboardEvent) Key Pressed:', event.altKey, event.ctrlKey, event.code);

      this.openAvModel(this.avModal);
    }
  }

  /**
   * Event handler for changing the stats overlay in videos.  It is
   * called from the settings modal.
   * @param event - Handle event.
   */
  handleStatsChanged(event: any) {
    log.debug('(handleStatsChanged) stats enabled:', this.videoStats);
    const evt = new GlobalEvent(EventClass.Command, EventType.ShowStats);
    evt.subject = ANY_SUBJECT;
    evt.target = this.videoStats ? 'on' : 'off';
    this.commandEventSource$.next(evt);
  }

  /**
   * Event handler for changing the Agora logging level.  It is
   * called from the settings modal.
   * @param event - Handle event.
   */

  handleAgoraLevelChanged(event: any) {
    log.debug('(handleAgoraLevelChanged) debugging:', this.agoraDebug);
    if (this.agoraDebug) {
      this.agoraService.setLogLevel(LogLevel.DEBUG);
    } else {
      this.agoraService.setLogLevel(LogLevel.INFO);
    }
  }

  /**
   * Display the AV Modal Dialog.
   * Also sets up handlers for when the modal is closed or dismissed. Note that action
   * is mostly taken as the model is changed.
   *
   * @param avModel - AV model.
   */
  openAvModel(avModel: TemplateRef<any>) {
    this.modalService
      .open(avModel, {
        ariaLabelledBy: 'modal-basic-title'
      })
      .result.then(
        result => {
          this.updateHelpMessage();
        },
        reason => {
          this.updateHelpMessage();
        }
      );
  }

  /**
   * Display the confirmation dialog when leaving the class.
   * Also sets up handlers for when the modal is closed or dismissed.
   *
   * @param openLeaveConfirmModel - AV model.
   */
  openLeaveConfirmModel(openLeaveConfirmModel: TemplateRef<any>) {
    this.modalService
      .open(openLeaveConfirmModel, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'rounded-modal'
      })
      .result.then(
        result => {
          const sessionLeaveUrl = `/session/leave/${this.currentClass.acronym}`;
          // One of the buttons was clicked
          log.debug('(openLeaveConfirmModel) Closed:', result);

          switch (result) {
            case 'leave': // Leave Class
              log.debug('(openLeaveConfirmModel) Leaving class');
              if (this.isTheInstructor) {
                this.doGroupViewClick();
              }

              this.router.navigate([sessionLeaveUrl]);
              break;

            case 'end': // End Class
              if (this.isTheInstructor) {
                log.debug('(openLeaveConfirmModel) ENDING class');
                const evt = new GlobalEvent(EventClass.Command, EventType.NavigateAll);
                evt.subject = ANY_SUBJECT;
                evt.sessionId = this.sessionStateService.sessionAcronym;
                evt.target = sessionLeaveUrl;
                this.viewChangedSource$.next(evt);
              }
              this.router.navigate([sessionLeaveUrl]);
              break;

            case 'cancel': // Cancel button
              log.debug('(openLeaveConfirmModel) Canceled');
              break;
          }
        },
        reason => {
          // Not-confirmed (dismissed)
          log.debug('(openLeaveConfirmModel) Dismissed:', reason);
        }
      );
  }

  musicSelected(event: any) {
    log.debug('(musicSelected) event:', event);
  }

  updateHelpMessage() {
    log.debug(`(updateHelpMessage) message:"${this.customHelpMessage}"`);
    const globalEvent = new GlobalEvent(EventClass.Command, EventType.SetHelpMessage);
    globalEvent.subject = ANY_SUBJECT;
    globalEvent.target = this.customHelpMessage;
    globalEvent.sessionId = this.sessionStateService.sessionAcronym;
    this.commandEventSource$.next(globalEvent);
  }

  musicVolumeChanged(event: any) {
    log.debug('(musicVolumeChanged) value:', this.musicVolume);
    const globalEvent = new GlobalEvent(EventClass.Command, EventType.MusicVolume);
    globalEvent.subject = ANY_SUBJECT;
    globalEvent.target = this.musicVolume;
    globalEvent.sessionId = this.sessionStateService.sessionAcronym;
    this.commandEventSource$.next(globalEvent);
  }

  /**
   * It's triggered when window resize
   */
  protected _onResize() {
    if (!this._window) {
      return;
    }

    // const isInstructor = this.credentialService.isInstructor();

    const CONTAINER_PADDING = 30;
    const MENU_WIDTH = this.isTheInstructor ? 190 : this.menuOpened ? 270 : 92;
    const windowView = {
      w: this._window.innerWidth - CONTAINER_PADDING * 2 - MENU_WIDTH,
      h: this._window.innerHeight - CONTAINER_PADDING * 2
    };

    // Count visible remote streams
    let numVideos = 0;
    for (const cv of this.meetingUserInfos) {
      if (!cv.isHidden) {
        numVideos++;
      }
    }

    const containerElement = this.containerElement.nativeElement;
    const view = { w: containerElement.clientWidth, h: containerElement.clientHeight };
    // log.debug('(_onResize) Container Size:', view, 'window:', windowView);
    const spacing = { h: 8, v: 36 };
    const margins = { top: 0, right: 0, bottom: 32, left: 0 };
    const maxArea = CalcSizes(numVideos, VIDEO_CELL_RATIO, view, spacing, margins);
    // log.debug('(_onResize) Solution:', maxArea);

    if (maxArea) {
      // Set location + size of all remote streams
      const { w: width, h: height } = maxArea;

      let i = 0;
      for (const meetingUserInfo of this.meetingUserInfos) {
        if (!meetingUserInfo.isHidden) {
          const { top, left } = maxArea.getPosition(i);
          meetingUserInfo.location = { top, left, width: maxArea.w, height: maxArea.h };
          i++;
        }
      }
    }
  }
}
