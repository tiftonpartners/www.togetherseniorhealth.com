import { OnInit, OnDestroy } from '@angular/core';
import { ClassObject } from '../sessions/class';
import { GenericSession } from '../sessions/session';
import { SessionStateService } from '../sessions/session-state.service';
import { CredentialsService, Logger } from '@app/core';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '@env/environment';
import { ClassMusicFile, MusicApiService } from '../sessions/music-api-service';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { GlobalEvent, EventType, EventClass, EMusicEvent, SERVER } from '@app/evnt/global-events';
import { ANY_SUBJECT, ERecordEvent, NO_TARGET } from '@app/evnt/global-events';
import { GlobalEventService } from '@app/evnt/global-events.service';
import { SessionApiService } from '../sessions/session-api.service';
import { UserApiService } from '@app/core/authentication/user-api.service';

import { EClientView } from '@app/shared/interfaces';
import { MatDialog } from '@angular/material/dialog';

const log = new Logger('AgoraAbstractComponent');

import { Mutex } from 'async-mutex';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MediaService } from '@app/shared/services/media/media.service';
import { AgoraService } from '@app/shared/services/agora/agora.service';
import { take, takeUntil } from 'rxjs/operators';
import MeetingUserInfo, { MeetingUserType } from './utils/meeting-user-info';
import { IMediaTrack } from '@app/shared/services/agora/core';
import { IAudioFileTrack } from '@app/shared/services/agora/core/audio-file-track';
import { IBufferSourceAudioTrack } from 'agora-rtc-sdk-ng';
import { VideoOptimizationMode } from '@app/shared/services/agora/agora.types';
import { OptimizationMode } from '@app/shared/services/agora/agora.consts';
import { AnalyticsService, sendGA } from '@app/analytics/analytics.service';
import { TypeHandleMute } from './utils/user-type-handler';
import AgoraMusic, { MusicState } from './utils/agora-music';
import UserType from './utils/user-type-factory';
import { IUserTypeHandler } from './utils/user-type-handler';

const VIDEO_ID_PREFIX = 'agora-meeting-user-';

export class AgoraAbstractComponent implements OnInit, OnDestroy {
  get sessionStateService() {
    return this._sessionStateService;
  }

  get router() {
    return this._router;
  }

  get activatedRoute() {
    return this._activatedRoute;
  }

  get globalEventService() {
    return this._globalEventService;
  }

  get credentialService() {
    return this._credentialService;
  }

  get agoraService() {
    return this._agoraService;
  }

  get currentUserId() {
    return this._currentUserId;
  }

  get getSnackBar() {
    return this.snackBar;
  }

  get musicApiService() {
    return this._musicApiService;
  }

  get userApiService() {
    return this._userApiService;
  }

  localUser: MeetingUserInfo; // Points to the meeting user for this (local) user
  meetingUserInfos: MeetingUserInfo[] = [];
  audioFileTrack: IAudioFileTrack;
  localFileTrack: IBufferSourceAudioTrack;

  isAudioEnabled = true; // Is audio enabled for all meeting users?
  isRecording = false;
  musicState = MusicState.STOPPED;
  isMusicPlaying = false;
  readyForMusic = false;
  musicVolume = environment.playMusicVolume;
  musicFiles: ClassMusicFile[] = [];
  selectedMusic: ClassMusicFile | undefined;
  videoOptimizationMode: VideoOptimizationMode = OptimizationMode.DETAIL;

  askedForHelp = false;

  isTheInstructor = false; // Is the current user the instructor for the class?
  instructorId: string;

  isAnObserver = false; // Is the current user an observer for the class?

  meetingUsersChangeMutex = new Mutex(); // Controls concurrent changes to meeting users

  /**
   * What view are we showing? GROUP, INSTRUCTOR, or SPOTLIGHT
   */
  currentView = EClientView.GROUP;
  currentSpotlightUserId: string | undefined; // What user are we spotlighting?
  isSpotlighting = false; // Are we in INSTRUCTOR or SPOTLIGHT view?

  allMutedRemotely = false; // Is everybody put on mute?

  // Fire events when media controls are changed (audio/video mute/unmute)
  mediaChangedSource$ = new Subject<GlobalEvent>();

  // tslint:disable-next-line: member-ordering
  mediaChanged$ = this.mediaChangedSource$.asObservable();

  // Fire events when the view chances (group/instructor views)
  viewChangedSource$ = new Subject<GlobalEvent>();
  // tslint:disable-next-line: member-ordering
  viewChanged$ = this.viewChangedSource$.asObservable();

  videoProfiles = environment.videoProfiles;
  /**
   * Debounced function to call on resize window
   */
  debouncedOnResize: () => {};

  currentClass: ClassObject;

  _currentUserId: string;
  _currentUserName: string;
  _meetingUserInfo: any = null;
  snackBarRef: any;

  subscriptions: Subscription[] = [];
  audioInId = '';
  videoInId = '';
  audioOutId = '';
  mediaTrack?: IMediaTrack;

  downlinkNetworkQuality = -1;
  uplinkNetworkQuality = -1;

  public customHelpMessage = 'The instructor has been notified that you need help.';

  pollSpeakerInterval: NodeJS.Timeout;

  // This flag is turned on while there is an outstanding
  // event to toggle music, guarding against
  // multiple button clicks ("debouncing") before the previous one is
  // implemented.
  public toggleMusicGuard = false;

  // Dismisses/destroys all subscribed subjects
  private destroy$: Subject<void> = new Subject();

  private userType: IUserTypeHandler;

  constructor(
    protected _sessionApiService: SessionApiService,
    protected _sessionStateService: SessionStateService,
    private _credentialService: CredentialsService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _globalEventService: GlobalEventService,
    protected _userApiService: UserApiService,
    protected _musicApiService: MusicApiService,
    private snackBar: MatSnackBar,
    protected modalService: NgbModal,
    public dialog: MatDialog,
    private _mediaService: MediaService,
    private _agoraService: AgoraService,
    protected analyticsService: AnalyticsService
  ) {
    this.userType = UserType.getUserType(this.isTheInstructor);
    this._globalEventService.listenTo(this.mediaChanged$);
    this._globalEventService.listenTo(this.viewChanged$);
    this._globalEventService.newCommand$.pipe(takeUntil(this.destroy$)).subscribe(event => {
      try {
        this.handleGlobalEvents(event);
      } catch (e) {
        log.error(e);
      }
    });

    analyticsService.setGetAnalyticsDimensions(this.getAnalyticsDimensions.bind(this));
  }

  handleGlobalEvents = async (evt: GlobalEvent) => {
    await this.userType.handler(evt, this);
  };

  /**
   * Handle status for music events
   * @param target The music event (play, pause, stop).
   */
  async handleMusicStatus(target: string) {
    const music: AgoraMusic = new AgoraMusic(this);
    // An event to play or pause music.
    const { audioFileTrack, localFileTrack, musicState, isMusicPlaying } = await music[target](
      this.snackBar,
      this._agoraService
    );
    this.audioFileTrack = audioFileTrack;
    this.localFileTrack = localFileTrack;
    this.musicState = musicState;
    this.isMusicPlaying = isMusicPlaying;
  }

  /**
   * Handle help wanted event
   * @param notice The object to norify the event.
   * @param target The global event target
   */
  handleHelpWanted(notice: GlobalEvent, target: string) {
    this.askedForHelp = target === 'on';
    notice.event = EventType.HelpWanted;
    notice.target = target;
    this.onAskForHelpChanged('Event');
  }

  /**
   * Change isRecording value
   * @param status The boolean value for isRecording.
   */
  setIsRecording(status: boolean) {
    this.isRecording = status;
  }

  /**
   * Change the message in customHelpMessage
   * @param evt The object with the global event info.
   */
  setHelpMessage(evt: GlobalEvent) {
    log.debug('(evt) SetHelp', JSON.stringify(evt.toFriendly()));
    this.customHelpMessage = evt.target;
  }

  /**
   * Change musicFiles value
   * @param musicFiles The list of music files.
   */
  setMusicFiles(musicFiles: ClassMusicFile[]) {
    this.musicFiles = musicFiles;
  }

  /**
   * Change selectedMusic value
   * @param selectedMusic The selected music.
   */
  setSelectedMusic(selectedMusic: ClassMusicFile | undefined) {
    this.selectedMusic = selectedMusic;
  }

  /**
   * Change readyForMusic value
   * @param readyForMusic If is ready for music or not.
   */
  setReadyForMusic(readyForMusic: boolean) {
    this.readyForMusic = readyForMusic;
  }

  /**
   * Change snackBarRef value
   * @param snackBarRef Snackbar ref.
   */
  setSnackBarRef(snackBarRef: any) {
    this.snackBarRef = snackBarRef;
  }

  /**
   * Change currentSpotlightUserId value
   * @param id New currentSpotlightUserId.
   */
  setCurrentSpotlightUserId(id: string) {
    this.currentSpotlightUserId = id;
  }

  /**
   * Change currentView value
   * @param view New currentView.
   */
  setCurrentView(view: EClientView) {
    this.currentView = view;
  }

  /**
   * Change currentView value
   * @param value New currentView.
   */
  setIsSpotlighting(value: boolean) {
    this.isSpotlighting = value;
  }

  /**
   * Change currentView value
   * @param localUser New currentView.
   */
  setLocalUser(localUser: MeetingUserInfo) {
    this.localUser = localUser;
  }

  /**
   * Toggle mic mute
   * @param obj with the mic and event info
   */
  @sendGA('muteAll', [1, 100], 'localUser.micOff', '', [0, 0])
  async handleMute({ micEvt, volume = 0, notice, noticeEvt, globalEvt }: TypeHandleMute) {
    await this.localUser[micEvt]();
    this.localUser.setVolume(volume);
    notice.event = noticeEvt;
    this.sendGlobalNotifyEvent(globalEvt);
  }

  /**
   * Set the volume level for music playing
   * @param volume The music volume.
   */
  setMusicVolume(volume: number) {
    this.musicVolume = volume;
    log.debug('(music) Volume Level:', volume);
    if (this.isMusicPlaying && this.localUser.meetingUser) {
      this.audioFileTrack.setVolume(volume);
      // this.localUser.meetingUser.mediaTrack.setVolume(volume);
    }
  }

  /**
   * The selected music has changed.
   * @param selectedMusic Selected music file.
   */
  doMusicSelected(selectedMusic: ClassMusicFile) {
    log.debug('(doMusicSelected) Music Selected:', JSON.stringify(selectedMusic, null, 2));
    const globalEvent = new GlobalEvent(EventClass.Command, EventType.Music);
    globalEvent.subject = ANY_SUBJECT;
    globalEvent.target = EMusicEvent.STOP;
    globalEvent.sessionId = this.sessionStateService.sessionAcronym;
    this.mediaChangedSource$.next(globalEvent);

    this.selectedMusic = selectedMusic;
  }

  /**
   * The selected video optimization mode has changed.
   */
  doVideoOptimizationModeSelected(videoOptimizationMode: VideoOptimizationMode) {
    this.videoOptimizationMode = videoOptimizationMode;
    if (this.localUser && this.localUser.meetingUser && this.localUser.meetingUser.mediaTrack) {
      this.localUser.meetingUser.mediaTrack.setOptimizationMode(videoOptimizationMode);
    }
  }

  // join a channel, assigning the user number in the
  // channel and publishing local camera + audio to the
  // channel.
  //
  // Returns the user number assigned to the user
  joinChannel = async (session: GenericSession, userId: string) => {
    let token: string;
    let userNumber: number;

    if (session.__t === 'ClassSession') {
      // A regular class session
      ({ token, userNumber } = await this._sessionApiService.getAgoraSessionToken$(session.acronym).toPromise());
    } else {
      // An adhoc session
      ({ token, userNumber } = await this._sessionApiService.getAgoraAdhocSessionToken$(session.acronym).toPromise());
    }

    log.debug('(joinChannel) token:', token, 'userNumber:', userNumber, 'userId:', userId);
    this.mediaTrack = await this._agoraService
      .join(session.acronym, token, userNumber)
      .withCameraAndMicrophone(this.audioInId, this.videoInId)
      .apply();

    await this._agoraService.enableDualStream();
  };

  /**
   * Subclasses override this to do things when the
   * askForHelp status changes
   */
  onAskForHelpChanged(comment?: string) {
    log.debug('(onAskForHelpChanged)');
  }

  /**
   * Mute all students
   *
   */
  doMuteAllClick() {
    this.allMutedRemotely = true;
    const evt = new GlobalEvent(EventClass.Command, EventType.MuteMicAll);
    evt.subject = ANY_SUBJECT;
    evt.sessionId = this.sessionStateService.sessionAcronym;
    this.mediaChangedSource$.next(evt);
  }

  /**
   * Unmute all students
   *
   */
  doUnmuteAllClick() {
    this.allMutedRemotely = false;
    const evt = new GlobalEvent(EventClass.Command, EventType.UnmuteMicAll);
    evt.subject = ANY_SUBJECT;
    evt.sessionId = this.sessionStateService.sessionAcronym;
    this.mediaChangedSource$.next(evt);
  }

  /**
   * Click action for when the Group View button is clicked
   */
  doGroupViewClick() {
    if (this.currentView === EClientView.GROUP) {
      return;
    }
    const evt = new GlobalEvent(EventClass.Command, EventType.ChangeViewAll);
    evt.subject = ANY_SUBJECT;
    evt.sessionId = this.sessionStateService.sessionAcronym;
    // const s = this.sessionStateService.session;
    evt.target = EClientView.GROUP;
    this.viewChangedSource$.next(evt);
  }

  /**
   * Click action for the help button
   */
  doAskForHelpClick() {
    const helpEvent = new GlobalEvent(EventClass.Command, EventType.HelpWanted);
    helpEvent.subject = this.credentialService.credentials.sub;
    helpEvent.sessionId = this.sessionStateService.sessionAcronym;
    helpEvent.target = this.askedForHelp ? 'off' : 'on';
    this.mediaChangedSource$.next(helpEvent);
  }

  /**
   * Click action for when the Instructor View button is clicked.
   */
  doSpotlightViewClick() {
    if (this.currentView === EClientView.SPOTLIGHT || this.currentView === EClientView.INSTRUCTOR) {
      return;
    }
    const evt = new GlobalEvent(EventClass.Command, EventType.ChangeViewAll);
    evt.subject = ANY_SUBJECT;
    evt.sessionId = this.sessionStateService.sessionAcronym;
    evt.target = EClientView.INSTRUCTOR;
    this.viewChangedSource$.next(evt);
  }

  /**
   * Event handler when the Spotlight button is clicked for a specific
   * video
   */
  doSpotlightEvent(userId: string) {
    log.debug(`(doSpotlightEvent): ${userId}`);
    const evt = new GlobalEvent(EventClass.Command, EventType.ChangeViewAll);
    evt.subject = ANY_SUBJECT;
    evt.sessionId = this.sessionStateService.sessionAcronym;
    evt.target = `spot:${userId}`;
    this.viewChangedSource$.next(evt);
  }

  /**
   * Event handler for when the microphone button is clicked for a specific
   * video
   */
  doParticipantMicrophoneEvent(userId: string) {
    const meetingUserInfo = this.userType.findMeetingUser(userId, this.meetingUserInfos);
    const eventType = meetingUserInfo.isMicOn ? EventType.MicOff : EventType.MicOn;
    this.sendGlobalCommandEvent(eventType, userId);
  }

  /**
   * Click action for when the video is shown/hidden for a specific video
   */
  doParticipantVideoEvent(userId: string) {
    const meetingUserInfo = this.userType.findMeetingUser(userId, this.meetingUserInfos);
    const eventType = meetingUserInfo.isCameraOn ? EventType.CameraOff : EventType.CameraOn;
    this.sendGlobalCommandEvent(eventType, userId);
  }

  /**
   * Click action for when we want to trigger a start over
   * for a specific participant
   */
  doParticipantStartOver(userId: string) {
    const eventType = EventType.StartOver;
    this.sendGlobalCommandEvent(eventType, userId);
  }

  /**
   * Click action for when the remote video stream type is changed for a specific video
   */
  async setRemoteVideoStreamType(data: any) {
    await this.userType.setRemoteVideoStreamType(data, this);
  }

  /**
   * Clear help for a user
   */
  doClearHelp(userId: string) {
    this.userType.doClearHelp(this, userId);
  }

  /**
   * Finish current class
   *
   */
  endClass() {
    this.userType.endClass(this);
  }

  onResize() {
    this.debouncedOnResize();
  }

  /**
   * Hide and unsubscribe to a remote stream, and remove its
   * video object from the DOM.  For local streams, they are simply hidden.
   *
   * This is called when switching views where the Mutex lock is managed
   */
  hideMeetingUser(meetingUserInfo: MeetingUserInfo) {
    console.log('===== hideMeetingUser =====', meetingUserInfo.isHidden);
    if (meetingUserInfo.isHidden) {
      return;
    }

    if (meetingUserInfo.meetingUser) {
      meetingUserInfo.meetingUser.isHidden = true;
    }
    meetingUserInfo.isHidden = true;
  }

  /**
   * Unhide and subscribe to a remote stream. For local streams, they are simply unhidden.
   * Note that they stream isn't played until the (on) event handler for stream
   * subscriptions sent by Agora is handled.
   *
   * This is called when switching views where the Mutex lock is managed
   */
  showMeetingUser(meetingUserInfo: MeetingUserInfo) {
    if (meetingUserInfo.meetingUser) {
      meetingUserInfo.meetingUser.isHidden = false;
    }
    meetingUserInfo.isHidden = false;
  }

  @sendGA('joined', [0, 0])
  leaveChannel() {
    this._agoraService.leave();
    if (this.mediaTrack) {
      this.mediaTrack.stop();
    }
  }

  @sendGA('userInfo', [0, 0])
  async ngOnInit() {
    log.debug('(ngOnInit) Start');

    const { name } = this._activatedRoute.snapshot.params;
    const { sub: userId = null, name: userName = null } = this.credentialService.credentials || {};
    this._currentUserId = userId;
    this._currentUserName = userName;

    this.currentClass = await this._sessionApiService.getGenericSession$(name).toPromise();
    log.debug('(ngOnInit) Current Session:', JSON.stringify(this.currentClass.firstSession, null, 2));

    this.isTheInstructor = this.currentClass.firstSession.instructorId === this._currentUserId;
    this.instructorId = this.currentClass.firstSession.instructorId;
    const videoOptimizationMode = this.currentClass.firstSession.videoOptimizationMode
      ? this.currentClass.firstSession.videoOptimizationMode
      : OptimizationMode.DETAIL;

    this.userType = UserType.getUserType(this.isTheInstructor);

    this.isAnObserver = this.userType.verifyIfObserver(this.currentClass.participants, userId);

    log.debug(`(ngOnInit) isTheInstructor:${this.isTheInstructor} isObserver:${this.isAnObserver}`);

    this.userType.initMusic(this);

    if (!this.currentClass) {
      this._router.navigate(['/']);
    }

    // This mutex keeps any view changes from coming in while
    // we are setting up the remoteStreams
    const mutexRelease = await this.meetingUsersChangeMutex.acquire();
    try {
      // Note: Setting the state can trigger a view change event from the server.
      this._sessionStateService.setState(this.currentClass.firstSession);
      await this._buildRemotePlaceholders(
        this.currentClass.firstSession.instructorId,
        this._currentUserId,
        this.currentClass.participants || [],
        videoOptimizationMode
      );

      this.initDevices();
      this.subscribeAgoraService();

      this.joinChannel(this.currentClass.firstSession, userId);
    } finally {
      mutexRelease();
    }

    this.setActiveSpeakerPolling();
    this.debouncedOnResize();
  }

  ngOnDestroy() {
    try {
      this.audioFileTrack.stop();
    } catch (e) {
    } finally {
      this.audioFileTrack = null;
      this.musicState = MusicState.STOPPED;
      this.isMusicPlaying = false;
    }

    this.leaveChannel();
    log.debug('Left agora channel');
    this._sessionStateService.close();

    this.unsubscribeAgoraService();
    this._globalEventService.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Refresh the current page
   *
   */
  refreshPage() {
    window.location.reload();
  }

  /**
   * Toggle local mic(on/off)
   */
  @sendGA('micOn', [0, 0], 'localUser.isMicOn', '', [1, 100])
  async doToggleMicClick() {
    log.debug(`${this.localUser.isMicOn ? 'Unm' : 'M'}ute myself!`);
    try {
      if (this.localUser.isMicOn) {
        await this.localUser.micOff();
      } else {
        await this.localUser.micOn();
      }
      const eventType = this.localUser.isMicOn ? EventType.MicOn : EventType.MicOff;
      this.sendGlobalNotifyEvent(eventType);
    } catch (e) {
      log.debug('===== doToggleMicClick error: ', e);
    }
  }

  /**
   * Toggle Local camera(on/off)
   */
  @sendGA('cameraOn', [0, 0], 'localUser.isCameraOn', '', [1, 0])
  async doToggleCameraClick() {
    log.debug(`${this.localUser.isCameraOn ? 'Enabled' : 'Disabled'} video!`);
    if (this.localUser) {
      try {
        if (this.localUser.isCameraOn) {
          await this.localUser.cameraOff();
        } else {
          await this.localUser.cameraOn();
        }
        const eventType = this.localUser.isCameraOn ? EventType.CameraOn : EventType.CameraOff;
        this.sendGlobalNotifyEvent(eventType);
      } catch (e) {
        log.debug('===== doToggleCameraClick error: ', e);
      }
    }
  }

  @sendGA('recordOn', [0, 0], 'isRecording', '', [1, 100])
  toggleRecording() {
    const globalEvent = new GlobalEvent(EventClass.Command, EventType.Record);
    globalEvent.subject = SERVER;
    globalEvent.target = this.isRecording ? ERecordEvent.PAUSE : ERecordEvent.ON;
    globalEvent.sessionId = this.sessionStateService.sessionAcronym;

    this.mediaChangedSource$.next(globalEvent);
  }

  @sendGA('play', [1, 100], 'musicState', MusicState.PLAYING, [0, 0])
  playMusic() {
    // Since the music file takes time to load, we wait for it to load before
    // sending the command
    if (this.readyForMusic) {
      const globalEvent = new GlobalEvent(EventClass.Command, EventType.Music);
      globalEvent.subject = ANY_SUBJECT;
      globalEvent.target =
        this.musicState === MusicState.PAUSED || this.musicState === MusicState.STOPPED
          ? EMusicEvent.PLAY
          : EMusicEvent.PAUSE;
      globalEvent.sessionId = this.sessionStateService.sessionAcronym;
      this.mediaChangedSource$.next(globalEvent);
    } else {
      log.debug('(music) Music not ready, waiting...');
      setTimeout(this.playMusic, 200);
    }
  }

  // Action behind play music button
  doToggleMusicClick() {
    if (this.toggleMusicGuard) {
      log.debug('(music) Guarded');
      return true;
    }
    this.toggleMusicGuard = true;
    // Mute participants during music
    this.doMuteAllClick();

    setTimeout(() => this.playMusic(), this.readyForMusic ? 0 : 1000);
  }

  // Agora parts
  initDevices() {
    forkJoin([
      this._mediaService.selectedAudioInputId.pipe(take(1)),
      this._mediaService.selectedAudioOutputId.pipe(take(1)),
      this._mediaService.selectedVideoInputId.pipe(take(1))
    ])
      .pipe(take(1))
      .subscribe(([aInId, aOutId, vInId]) => {
        this.audioInId = aInId;
        this.videoInId = vInId;
        this.audioOutId = aOutId;
      });
  }

  /**
   * Set video quality for the local user
   */
  setVideoQuality() {
    this.userType.setVideoQuality(this);
  }

  /*
   * Subscribe the listeners for the user's joining status
   */
  subscribeAgoraService() {
    if (environment.disableAv) {
      log.debug('(setupClient) AV Disabled');
      this._onResize.bind(this);
      return true;
    }

    const remoteUserJoinedSub = this._agoraService.onRemoteUserJoined().subscribe(user => {
      this.userType.addedMeetingUser(this, MeetingUserType.REMOTE, user);
    });
    this.subscriptions.push(remoteUserJoinedSub);

    const remoteUserLeaveSubs = this._agoraService.onRemoteUserLeft().subscribe(leftUser => {
      this.userType.removeMeetingUser(this, leftUser.user.uid);
    });
    this.subscriptions.push(remoteUserLeaveSubs);

    const remoteUserChangeSubs = this._agoraService
      .onRemoteUsersStatusChange()
      .subscribe(this.callbackRemoteUserChangeSubs.bind(this));
    this.subscriptions.push(remoteUserChangeSubs);

    const localUserJoinedSubs = this._agoraService
      .onLocalUserJoined()
      .subscribe(this.callBackLocalUserJoinedSubs.bind(this));
    this.subscriptions.push(localUserJoinedSubs);

    const localNetworkQualitySubs = this._agoraService
      .onLocalNetworkQualityChange()
      .subscribe(this.callbackLocalNetworkQualitySubs.bind(this));

    this.subscriptions.push(localNetworkQualitySubs);
  }

  unsubscribeAgoraService() {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  reportRemoteUserStats() {
    for (const meetingUserInfo of this.meetingUserInfos) {
      if (meetingUserInfo.meetingUser && meetingUserInfo.meetingUser.user) {
        this.meetingUserInfoGA(meetingUserInfo);
      }
    }
  }

  /**
   * @description get analytics dimensions for analyticsService
   */
  public getAnalyticsDimensions() {
    const minutes = Math.floor(Date.now() / (15 * 1000)) * 15; // 15 second intervals
    this._meetingUserInfo =
      this._meetingUserInfo ||
      (this.userType.findMeetingUser(this._currentUserId, this.meetingUserInfos) as MeetingUserInfo);

    return {
      class_id: this.currentClass ? this.currentClass._id : 'n/a',
      class_name: this.currentClass ? this.currentClass.name : 'n/a',
      class_acronym: this.currentClass ? this.currentClass.acronym : 'n/a',
      instructor_id: this.instructorId,
      is_instructor: this.isTheInstructor,
      session_remote_user_id:
        this._meetingUserInfo && this._meetingUserInfo.meetingUser && this._meetingUserInfo.meetingUser.user
          ? this._meetingUserInfo.meetingUser.user.uid
          : this._currentUserId,
      participant_id: this._currentUserId,
      user_name:
        this._meetingUserInfo && this._meetingUserInfo.userInfo
          ? this._meetingUserInfo.userInfo.name
          : this._currentUserName,
      ts: minutes
    };
  }

  protected _onResize() {}

  /**
   * Activate/deactivate current speaker polling.
   */
  private setActiveSpeakerPolling(): void {
    this.userType.setActiveSpeakerPolling(this);
  }

  /**
   * Container method used by reportRemoteUserStats to inject a call to GA send method for each meetingUserInfo
   * @param meetingUserInfo Used by the decorator function to call the GA send method
   */
  @sendGA()
  private meetingUserInfoGA(meetingUserInfo: MeetingUserInfo) {}

  /**
   * Callback for localNetworkQualitySubs subscribe with a decorator to inject a call to GA send method
   * @param stats Network stats info
   */
  @sendGA()
  private callbackLocalNetworkQualitySubs(stats: any) {
    if (this.downlinkNetworkQuality !== stats.download || this.uplinkNetworkQuality !== stats.upload) {
      this.downlinkNetworkQuality = stats.download;
      this.uplinkNetworkQuality = stats.download;
    }
  }

  /**
   * Callback for remoteUserChangeSubs subscribe with a decorator to inject a call to GA send method
   * @param status User state info
   */
  @sendGA()
  private callbackRemoteUserChangeSubs(status: any) {
    switch (status.connectionState) {
      case 'CONNECTED':
        this.userType.addedMeetingUser(this, MeetingUserType.REMOTE, status.user);
        break;
      case 'DISCONNECTED':
      case 'DISCONNECTING':
      case 'RECONNECTING':
        const currentUserIndex = this.meetingUserInfos.findIndex(user => user.meetingUserId === status.user.uid);
        if (currentUserIndex >= 0) {
          const isHidden = this.meetingUserInfos[currentUserIndex].isHidden;
          this.meetingUserInfos[currentUserIndex].meetingUser = {
            type: MeetingUserType.REMOTE,
            user: status.user,
            isHidden
          };
        }
        break;
    }
  }

  /**
   * Callback for localUserJoinedSubs subscribe with a decorator to inject a call to GA send method
   * @param user User info
   */
  @sendGA('joined', [1, 100])
  private callBackLocalUserJoinedSubs(user: any) {
    this.userType.addedMeetingUser(this, MeetingUserType.LOCAL, user);
  }

  /**
   * Create a Global command event and send it to the Observable
   */
  private sendGlobalCommandEvent(eventType: EventType, targetUser: string, target?: any) {
    const commandEvent = new GlobalEvent(EventClass.Command, eventType);
    commandEvent.subject = targetUser;
    commandEvent.target = target ? target : NO_TARGET;
    commandEvent.sessionId = this.sessionStateService.sessionAcronym;

    this.mediaChangedSource$.next(commandEvent);
  }

  /**
   * Create a Global notify event and send it to the Observable
   */
  private sendGlobalNotifyEvent(eventType: EventType) {
    const notifyEvent = new GlobalEvent(EventClass.Notify, eventType);
    notifyEvent.subject = this._currentUserId;
    notifyEvent.sessionId = this.sessionStateService.sessionAcronym;

    this.mediaChangedSource$.next(notifyEvent);
  }

  /**
   * Make placeholders for participants
   *
   * This will make one placeholder entry in the remoteStreams list for each participant plus
   * the instructor.  The instructor will always be the first entry, followed by the current
   * user.  The stream for each entry will be undefined, and the userInfo will contain only the
   * corresponding user's ID.
   */
  private async _buildRemotePlaceholders(
    instructorId: string,
    userId: string,
    participants: string[],
    videoOptimizationMode: VideoOptimizationMode
  ) {
    // Remove the current user from the participant list
    const filtered = participants.filter(participant => {
      return participant !== userId;
    });
    const ids =
      instructorId === userId || this.isAnObserver ? [instructorId, ...filtered] : [instructorId, userId, ...filtered];

    // Build list of streams
    const meetingUsers = ids.map(participant => {
      const meetingUserInfo = new MeetingUserInfo(null, null);
      // We show controls for the video if (1) we are the instructor and (2) the video is not for the instructor
      meetingUserInfo.showIndicators = this.isTheInstructor;
      meetingUserInfo.isTheInstructor = participant === instructorId;
      meetingUserInfo.videoOptimizationMode = videoOptimizationMode;
      return meetingUserInfo;
    });

    // List of information about each user
    const userInfos$ = ids.map(participant => {
      return this._userApiService.getUserById(participant).toPromise();
    });
    const userInfos = await Promise.all(userInfos$);
    for (let i = 0; i < meetingUsers.length; i++) {
      meetingUsers[i].userInfo = userInfos[i];
      meetingUsers[i].meetingUserId = userInfos[i].userNumber;
      meetingUsers[i].videoContainerId = VIDEO_ID_PREFIX + meetingUsers[i].meetingUserId;
      if (ids[i] === userId) {
        this.localUser = meetingUsers[i];
        this.localUser.isLocalPreview = true;
      }
      this.meetingUserInfos.push(meetingUsers[i]);
    }
  }
}
