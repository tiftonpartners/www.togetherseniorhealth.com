import { OnInit, OnDestroy } from '@angular/core';
import { ClassObject } from '../sessions/class';
import { GenericSession } from '../sessions/session';
import { SessionStateService } from '../sessions/session-state.service';
import { CredentialsService, Logger } from '@app/core';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '@env/environment';
import { ClassMusicFile, MusicApiService } from '../sessions/music-api-service';
import { forkJoin, Subject, Subscription } from 'rxjs';
import {
  GlobalEvent,
  EventType,
  EventClass,
  EMusicEvent,
  IsRecordingEvent,
  SERVER,
  IsHelpEvent,
  IsQosEvent,
  IsActiveSessionEvent
} from '@app/evnt/global-events';
import {
  ANY_SUBJECT,
  ERecordEvent,
  IsForAllParticipants,
  IsMediaEvent,
  IsMicEvent,
  IsVideoEvent,
  NO_TARGET
} from '@app/evnt/global-events';
import { GlobalEventService } from '@app/evnt/global-events.service';
import { SessionApiService } from '../sessions/session-api.service';
import { UserApiService } from '@app/core/authentication/user-api.service';
import { UserInfo } from '@app/core/authentication/user.types';

import { EClientView } from '@app/shared/interfaces';
import { MatDialog } from '@angular/material/dialog';
import { DefaultDialogComponent, DefaultDialogData } from '@app/shared/default-dialog/default-dialog.component';

const log = new Logger('AgoraAbstractComponent');

import { Mutex } from 'async-mutex';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MediaService } from '@app/shared/services/media/media.service';
import { AgoraService } from '@app/shared/services/agora/agora.service';
import { take } from 'rxjs/operators';
import MeetingUserInfo, { MeetingUserType } from './utils/meeting-user-info';
import { IMediaTrack } from '@app/shared/services/agora/core';
import { IAudioFileTrack } from '@app/shared/services/agora/core/audio-file-track';
import { IAgoraRTCClient, RemoteStreamType, VideoEncoderConfigurationPreset } from 'agora-rtc-sdk-ng';
import { LookupAgoraVideoProfile } from './utils/agora-video-constants';
import { VideoOptimizationMode } from '@app/shared/services/agora/agora.types';
import { OptimizationMode } from '@app/shared/services/agora/agora.consts';
import { GAEvent } from '@app/evnt/ga-events';
import { AnalyticsService } from '@app/analytics/analytics.service';

const VIDEO_ID_PREFIX = 'agora-meeting-user-';

// Delay for a number of msec randomly selected within a range
// function randomSleepMsec(msecMin: number, msecMax: number) {
//   const msecs = Math.floor(Math.random() * (msecMax - msecMin + 1) + msecMin);
//   return new Promise(resolve => setTimeout(resolve, msecs));
// }

export enum MusicState {
  PAUSED = 'pause',
  STOPPED = 'stop',
  PLAYING = 'play'
}

// 'https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_5MG.mp3'
// export const SAMPLE_MUSIC = 'https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_5MG.mp3';

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

  localUser: MeetingUserInfo; // Points to the meeting user for this (local) user
  meetingUserInfos: MeetingUserInfo[] = [];
  audioFileTrack: IAudioFileTrack;

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
  private toggleMusicGuard = false;

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
    this._globalEventService.listenTo(this.mediaChanged$);
    this._globalEventService.listenTo(this.viewChanged$);
    this._globalEventService.newCommand$.subscribe(event => {
      try {
        this.handleGlobalEvents(event).then(() => {});
      } catch (e) {
        log.error(e);
      }
    });

    analyticsService.setGetAnalyticsDimensions(this.getAnalyticsDimensions.bind(this));
  }

  handleGlobalEvents = async (evt: GlobalEvent) => {
    // const isInstructor = this.credentialService.hasPermission(Auth0Permission.ignore_globalcmds);
    const isNotify = evt.eventClass === EventClass.Notify;
    const isCommand = evt.eventClass === EventClass.Command;

    // (evt) Handling Global Event:log.debug('(evt) Handling Global Event:', JSON.stringify(evt.toFriendly()));
    if (IsForAllParticipants(evt.event) && this.isTheInstructor) {
      log.debug('(evt) Instructor ignores:', JSON.stringify(evt.toFriendly()));
      return;
    }

    if (isNotify && evt.subject !== this._currentUserId) {
      if (IsMediaEvent(evt.event)) {
        log.debug('(evt) IsMediaEvent:', JSON.stringify(evt.toFriendly()));
        // We need to reflect this event in the UI
        for (const meetingUserInfo of this.meetingUserInfos) {
          if (meetingUserInfo.userInfo.id === evt.subject) {
            log.debug('(evt) Subject matches:', meetingUserInfo.userInfo.id);
            if (IsMicEvent(evt.event)) {
              if (evt.event === EventType.MicOn) {
                meetingUserInfo.isMicOn = true;
              } else if (evt.event === EventType.MicOff) {
                meetingUserInfo.isMicOn = false;
              }
            } else if (IsVideoEvent(evt.event)) {
              if (evt.event === EventType.CameraOn) {
                meetingUserInfo.isCameraOn = true;
              } else if (evt.event === EventType.CameraOff) {
                meetingUserInfo.isCameraOn = false;
              }
            } else if (IsQosEvent(evt.event)) {
              meetingUserInfo.qos = evt.target === 'on';
            } else if (IsActiveSessionEvent(evt.event)) {
              log.debug('(evt) Active Session Event:', evt);
              switch (evt.event) {
                case EventType.SessionInactive:
                  // Session is inactive - mark as such
                  meetingUserInfo.isSessionInactive = true;
                  log.debug('(evt) (sessionInactive) Session is INACTIVE');
                  break;

                case EventType.SessionActive:
                  meetingUserInfo.isSessionInactive = false;
                  // The target gives the current media status.
                  // Can be JSON as a string, or just JSON
                  let target = evt.target;
                  if (typeof target === 'string') {
                    target = JSON.parse(target);
                  }
                  log.debug('(evt) Session is ACTIVE, target:', JSON.stringify(target, null, 2));
                  meetingUserInfo.isMicOn = target.isEnabledAudio;
                  meetingUserInfo.isCameraOn = target.isEnabledVideo;
                  log.debug(
                    `(evt) (sessionInactive) Session is ACTIVE, audioMuted:
                    ${meetingUserInfo.isMicOn} videoMuted:${meetingUserInfo.isCameraOn}`
                  );
                  break;

                case EventType.SessionJoined:
                  break;

                case EventType.SessionLeft:
                  log.debug(`(evt) (sessionInactive) Session LEFT`);
                  meetingUserInfo.isMicOn = true;
                  meetingUserInfo.isCameraOn = true;
                  meetingUserInfo.isSpeaking = false;
                  break;
              }
            }
          }
        }
      } else if (IsRecordingEvent(evt.event)) {
        this.isRecording = evt.target === ERecordEvent.ON;
      } else if (IsHelpEvent(evt.event)) {
        const meetingUser = this.findMeetingUser(evt.subject);
        if (meetingUser) {
          meetingUser.helpWanted = evt.target === 'on';
        }
      }
    }

    if (isCommand && (evt.subject === this._currentUserId || evt.subject === ANY_SUBJECT)) {
      // This event will notify on the completed event
      const notice: GlobalEvent = new GlobalEvent(EventClass.Notify, EventType.Unknown);
      notice.sessionId = evt.sessionId;
      notice.subject = this.credentialService.credentials.sub;

      switch (evt.event) {
        case EventType.MicOn:
        case EventType.MicOff:
          await this.doToggleMicClick();
          break;

        case EventType.CameraOn:
        case EventType.CameraOff:
          await this.doToggleCameraClick();
          break;

        case EventType.MuteMicAll:
          this.localUser.setVolume(0);
          await this.localUser.micOff();
          notice.event = EventType.MuteMicAll;

          this.sendGlobalNotifyEvent(EventType.MicOff);

          this.analyticsService.send(GAEvent.muteAll, 1, 100);
          break;

        case EventType.UnmuteMicAll:
          await this.localUser.micOn();
          this.localUser.setVolume(environment.defaultVolume);
          notice.event = EventType.UnmuteMicAll;

          this.sendGlobalNotifyEvent(EventType.MicOn);

          this.analyticsService.send(GAEvent.muteAll, 0, 0);
          break;
        case EventType.Navigate:
        case EventType.NavigateAll:
          log.debug(`(evt) Navigating to:"${evt.target}`);
          await this.router.navigate([evt.target]);
          break;

        case EventType.ChangeView:
        case EventType.ChangeViewAll:
          log.debug(`(evt) Changing view to:"${evt.target}"`);

          // Keep other changes to remote state from happening
          // while we switch views
          if (evt.target.startsWith('spot')) {
            const userId = evt.target.substr(5);
            await this.switchToSpotlight(userId);
          } else if (evt.target === EClientView.GROUP) {
            this.switchToGroup();
          } else if (evt.target === EClientView.INSTRUCTOR) {
            await this.switchToInstructor();
          }

          this.sendMediaStatus();
          break;

        case EventType.LeaveInstructor:
          this.switchToGroup();
          break;

        case EventType.MediaStatus:
        case EventType.MediaStatusAll:
          this.sendMediaStatus();
          break;

        case EventType.Music:
          // An event to play or pause music.
          switch (evt.target) {
            case EMusicEvent.PLAY:
              switch (this.musicState) {
                case MusicState.PLAYING:
                  // G2G
                  this.toggleMusicGuard = false;
                  break;
                case MusicState.PAUSED:
                  // Resume audio mixing
                  try {
                    if (this.audioFileTrack) {
                      this.audioFileTrack.resume();

                      this.musicState = MusicState.PLAYING;
                      this.isMusicPlaying = true;
                      this.toggleMusicGuard = false;

                      log.debug('(music) Audio Mixing Resumed');
                    }
                  } catch (err) {
                    log.error('(music) ERROR Resuming Audio Mixing:', err);
                  }
                  break;
                case MusicState.STOPPED:
                  // Create audio file on new file
                  const options = {
                    cacheOnlineFile: true,
                    source: this.selectedMusic.unsignedURI
                  };

                  // Starts audio mixing.
                  this.snackBarRef = this.snackBar.open('Loading music...', 'Ok');

                  try {
                    this.audioFileTrack = await this._agoraService.joinAudioFile().create(options);
                    if (this.audioFileTrack) {
                      this.audioFileTrack.setVolume(this.musicVolume);

                      const client: IAgoraRTCClient = this._agoraService.getClient();
                      await client.publish(this.audioFileTrack.bufferSourceAudioTrack());
                      this.audioFileTrack.play({ loop: true });

                      this.musicState = MusicState.PLAYING;
                      this.isMusicPlaying = true;
                      this.toggleMusicGuard = false;
                      log.debug(`(music) Audio mixing started`);
                    }
                  } catch (err) {
                    log.error('(music) ERROR starting audio mixing. ' + err);
                  }

                  if (this.snackBarRef) {
                    this.snackBarRef.dismiss();
                    this.snackBarRef = undefined;
                  }
              }
              break; // End, PLAY event
            case EMusicEvent.PAUSE:
              switch (this.musicState) {
                case MusicState.PLAYING:
                  try {
                    if (this.audioFileTrack) {
                      this.audioFileTrack.pause();

                      this.musicState = MusicState.PAUSED;
                      this.isMusicPlaying = false;
                      this.toggleMusicGuard = false;

                      log.debug('(music) Audio Mixing Paused');
                    }
                  } catch (err) {
                    log.error('(music) ERROR Pausing Audio Mixing:', err);
                  }
                  break;
                case MusicState.PAUSED:
                case MusicState.STOPPED:
                  // G2G
                  this.toggleMusicGuard = false;
                  break;
              }
              break;
            case EMusicEvent.STOP:
              switch (this.musicState) {
                case MusicState.PLAYING:
                case MusicState.PAUSED:
                  try {
                    if (this.audioFileTrack) {
                      this.audioFileTrack.pause();

                      this.musicState = MusicState.STOPPED;
                      this.isMusicPlaying = false;
                      this.toggleMusicGuard = false;

                      log.debug('(music) Audio Mixing Stopped');
                    }
                  } catch (err) {
                    log.error('(music) ERROR Stopping Audio Mixing:', err);
                  }
                  break;
                case MusicState.STOPPED:
                  this.toggleMusicGuard = false;
                  // G2G
                  break;
              }
              break;

            default:
              log.error('ERROR: Unknown Music event target in event:', JSON.stringify(evt, null, 2));
              break;
          }
          break; // End, EventType.Music

        case EventType.MusicVolume:
          this.setMusicVolume(evt.target);
          break;

        case EventType.HelpWanted:
          this.askedForHelp = evt.target === 'on';
          notice.event = EventType.HelpWanted;
          notice.target = evt.target;
          this.onAskForHelpChanged('Event');
          break;

        case EventType.SetHelpMessage:
          log.debug('(evt) SetHelp', JSON.stringify(evt.toFriendly()));
          this.customHelpMessage = evt.target;
          break;

        case EventType.StartOver:
          this.refreshPage();
          log.debug('(evt) startOver');
          break;
      }

      // Send out notice of the change, if any
      if (notice.event !== EventType.Unknown) {
        this.mediaChangedSource$.next(notice);
      }
    }
  };

  /**
   * Find a meeting user in the current joined
   */
  findMeetingUser(userId: string): MeetingUserInfo | null {
    if (!this.meetingUserInfos || !this.meetingUserInfos.length) {
      return null;
    }

    return this.meetingUserInfos.find(meetingUserInfo => {
      return meetingUserInfo.userInfo && meetingUserInfo.userInfo.id === userId;
    });
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
    // const s = this.sessionStateService.session;
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
    const meetingUserInfo = this.findMeetingUser(userId);
    const eventType = meetingUserInfo.isMicOn ? EventType.MicOff : EventType.MicOn;
    this.sendGlobalCommandEvent(eventType, userId);
  }

  /**
   * Click action for when the video is shown/hidden for a specific video
   */
  doParticipantVideoEvent(userId: string) {
    const meetingUserInfo = this.findMeetingUser(userId);
    const eventType = meetingUserInfo.isCameraOn ? EventType.CameraOff : EventType.CameraOn;
    this.sendGlobalCommandEvent(eventType, userId);
  }

  /**
   * Click action for when we want to trigger a start over
   * for a specific participant
   */
  doParticipantStartOver(userId: string) {
    // const meetingUserInfo = this.findMeetingUser(userId);
    const eventType = EventType.StartOver;
    this.sendGlobalCommandEvent(eventType, userId);
  }

  /**
   * Click action for when the remote video stream type is changed for a specific video
   */
  async setRemoteVideoStreamType(data: any) {
    if (this.isTheInstructor) {
      const userId = data.userId;
      const remoteStreamType = data.remoteStreamType as RemoteStreamType;

      if (userId) {
        if (remoteStreamType === RemoteStreamType.HIGH_STREAM) {
          for (const meetingUserInfo of this.meetingUserInfos) {
            if (meetingUserInfo.meetingUser && !meetingUserInfo.isLocalPreview) {
              if (meetingUserInfo.userInfo.id === userId) {
                await this._agoraService.setRemoteVideoStreamType(
                  meetingUserInfo.meetingUser.user.uid,
                  remoteStreamType
                );
                meetingUserInfo.remoteStreamType = remoteStreamType;
              } else {
                await this._agoraService.setRemoteVideoStreamType(
                  meetingUserInfo.meetingUser.user.uid,
                  RemoteStreamType.LOW_STREAM
                );
                meetingUserInfo.remoteStreamType = RemoteStreamType.LOW_STREAM;
              }
            }
          }
        } else {
          const meetingUserInfo = this.findMeetingUser(userId);
          if (meetingUserInfo && meetingUserInfo.meetingUser) {
            await this._agoraService.setRemoteVideoStreamType(meetingUserInfo.meetingUser.user.uid, remoteStreamType);
            meetingUserInfo.remoteStreamType = remoteStreamType;
          }
        }
      }
    }
  }

  /**
   * Clear help for a user
   */
  doClearHelp(userId: string) {
    log.debug('(doClearHelp)');
    const meetingUser = this.findMeetingUser(userId);
    if (meetingUser) {
      const globalEvent = new GlobalEvent(EventClass.Command, EventType.HelpWanted);
      globalEvent.subject = userId;
      globalEvent.target = 'off';
      globalEvent.sessionId = this.sessionStateService.sessionAcronym;
      log.debug('(doClearHelp) Sending Event:', globalEvent.toFriendly());
      this.mediaChangedSource$.next(globalEvent);
    }
  }

  // Send the state of the current media buttons over the
  // global event bus
  sendMediaStatus() {
    if (!this.localUser) {
      return;
    }
    const isMutedEvent = new GlobalEvent(
      EventClass.Notify,
      this.localUser.isMicOn ? EventType.MicOn : EventType.MicOff
    );
    isMutedEvent.subject = this.credentialService.credentials.sub;
    isMutedEvent.sessionId = this.sessionStateService.sessionAcronym;
    this.mediaChangedSource$.next(isMutedEvent);

    const isVideoMutedEvent = new GlobalEvent(
      EventClass.Notify,
      this.localUser.isCameraOn ? EventType.CameraOn : EventType.CameraOff
    );
    isVideoMutedEvent.subject = this.credentialService.credentials.sub;
    isVideoMutedEvent.sessionId = this.sessionStateService.sessionAcronym;
    this.mediaChangedSource$.next(isVideoMutedEvent);

    // Are we asking for help?
    const helpEvent = new GlobalEvent(EventClass.Notify, EventType.HelpWanted);
    helpEvent.subject = this.credentialService.credentials.sub;
    helpEvent.sessionId = this.sessionStateService.sessionAcronym;
    helpEvent.target = this.askedForHelp ? 'on' : 'off';
    this.mediaChangedSource$.next(helpEvent);
  }

  /**
   * Finish current class
   *
   */
  endClass() {
    const { userInfo: { isAnInstructor = false } = {} } = this.localUser;
    const data: DefaultDialogData = {
      title: 'Please Confirm',
      message: this.isTheInstructor ? 'Do you want to leave, end class?' : 'Do you want to leave class?',
      leaveButton: 'Leave',
      cancelButton: 'Cancel'
    };

    if (this.isTheInstructor) {
      data.endButton = 'End';
    }

    const dialogRef = this.dialog.open(DefaultDialogComponent, {
      panelClass: 'position-relative',
      data
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      const realResult = Number(result);
      const sessionLeaveUrl = `/session/leave/${this.currentClass.acronym}`;

      switch (realResult) {
        case 1: // Leave Class
          this._router.navigate([sessionLeaveUrl]).then(() => {});
          break;
        case 2: // End Class
          if (this.isTheInstructor) {
            const evt = new GlobalEvent(EventClass.Command, EventType.NavigateAll);
            evt.subject = ANY_SUBJECT;
            evt.sessionId = this.sessionStateService.sessionAcronym;
            evt.target = sessionLeaveUrl;
            this.viewChangedSource$.next(evt);
          }

          this._router.navigate([sessionLeaveUrl]).then(() => {});
          break;
        case 0:
        default:
          break;
      }
    });
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
   * Unhidden and subscribe to a remote stream. For local streams, they are simply unhidden.
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

  /**
   * Spotlight a specific user, turning off the video view of
   * all other users
   *
   * @param userId User ID who's video is to be spotlighted
   */
  async switchToSpotlight(userId: string) {
    log.debug('(switchToSpotlight) user:', userId);
    this.currentView = EClientView.SPOTLIGHT;
    this.isSpotlighting = true;
    this.currentSpotlightUserId = userId;

    const mutexRelease = await this.meetingUsersChangeMutex.acquire();
    try {
      this.meetingUserInfos.forEach(meetingUserInfo => {
        meetingUserInfo.isSpotlight = meetingUserInfo.userInfo.id === userId || meetingUserInfo.isTheInstructor;
        // Nothing is hidden/shown for the instructor
        if (!this.isTheInstructor) {
          if (meetingUserInfo.userInfo.id === userId || meetingUserInfo.isTheInstructor) {
            // I'm being spotlighted - how exciting!
            meetingUserInfo.isSpotlight = true;
            this.showMeetingUser(meetingUserInfo);
          } else {
            this.hideMeetingUser(meetingUserInfo);
            meetingUserInfo.isSpotlight = false;
          }
        }
      });
      this.setActiveSpeakerPolling();
    } finally {
      mutexRelease();
    }

    this.debouncedOnResize();

    this.analyticsService.send(GAEvent.spotlightEvent, 1, 100);
  }

  /**
   * Switch to Instructor view - spotlighting the instructor only
   *
   */
  async switchToInstructor() {
    log.debug(`(switchToInstructor) isTheInstructor:${this.isTheInstructor}`);
    this.currentView = EClientView.INSTRUCTOR;
    this.isSpotlighting = true;
    this.currentSpotlightUserId = undefined;

    const mutexRelease = await this.meetingUsersChangeMutex.acquire();
    try {
      this.meetingUserInfos.forEach(meetingUserInfo => {
        meetingUserInfo.isSpotlight = meetingUserInfo.isTheInstructor;
        // Nothing changes for the instructor
        if (!this.isTheInstructor) {
          if (meetingUserInfo.isTheInstructor) {
            this.currentSpotlightUserId = meetingUserInfo.userInfo.id;
            this.showMeetingUser(meetingUserInfo);
          } else {
            this.hideMeetingUser(meetingUserInfo);
          }
        }
      });
      this.setActiveSpeakerPolling();
    } finally {
      mutexRelease();
    }

    this.debouncedOnResize();

    this.analyticsService.send(GAEvent.spotlightView, 1, 100);
  }

  /**
   * Switch to Group view - showing all users
   */
  async switchToGroup() {
    log.debug('(switchToGroup)');

    const mutexRelease = await this.meetingUsersChangeMutex.acquire();
    try {
      this.currentView = EClientView.GROUP;
      this.currentSpotlightUserId = undefined;
      this.isSpotlighting = false;

      this.meetingUserInfos.forEach(remoteStream => {
        remoteStream.isSpotlight = false;
        this.showMeetingUser(remoteStream);
      });
      this.setActiveSpeakerPolling();
    } finally {
      mutexRelease();
    }

    this.debouncedOnResize();

    this.analyticsService.send(GAEvent.groupView, 1, 100);
  }

  leaveChannel() {
    this._agoraService.leave().then(() => {});
    if (this.mediaTrack) {
      this.mediaTrack.stop();
    }

    this.analyticsService.send(GAEvent.joined, 0, 0);
  }

  async ngOnInit() {
    log.debug('(ngOnInit) Start');

    const { name } = this._activatedRoute.snapshot.params;
    const { sub: userId = null } = this.credentialService.credentials || {};
    this._currentUserId = userId;

    this.currentClass = await this._sessionApiService.getGenericSession$(name).toPromise();
    log.debug('(ngOnInit) Current Session:', JSON.stringify(this.currentClass.firstSession, null, 2));

    this.isTheInstructor = this.currentClass.firstSession.instructorId === this._currentUserId;
    this.instructorId = this.currentClass.firstSession.instructorId;
    const videoOptimizationMode = this.currentClass.firstSession.videoOptimizationMode
      ? this.currentClass.firstSession.videoOptimizationMode
      : OptimizationMode.DETAIL;
    // We are an observer if we aren't the instructor and we are not a participant
    this.isAnObserver =
      !this.isTheInstructor &&
      this.currentClass.participants.reduce((acc: string, currentValue: string): string => {
        return acc === 'false' ? 'false' : currentValue === userId ? 'false' : 'true';
      }, 'true') === 'true';
    log.debug(`(ngOnInit) isTheInstructor:${this.isTheInstructor} isObserver:${this.isAnObserver}`);

    if (this.isTheInstructor && !environment.disableAv) {
      this.snackBarRef = this.snackBar.open('Loading music...', 'Ok');
      log.debug('(music) Volume Level:', this.musicVolume);

      this._musicApiService.getMusicFiles().subscribe((musicFiles: ClassMusicFile[]) => {
        // Select one music file, as determined by the
        // environment variable, or failing that choose the first.
        if (musicFiles && musicFiles.length > 0) {
          this.musicFiles = musicFiles;
          this.selectedMusic = this.musicFiles[0];
          musicFiles.forEach((musicFile: ClassMusicFile) => {
            if (musicFile.title === environment.defaultSong) {
              this.selectedMusic = musicFile;
            }
          });
          log.debug('(ngOnInit) Music File:', JSON.stringify(this.selectedMusic, null, 2));
        } else {
          log.error('ERROR: No Class Music File');
        }
        this.readyForMusic = true;
        if (this.snackBarRef) {
          this.snackBarRef.dismiss();
          this.snackBarRef = undefined;
        }
      });
    }

    if (!this.currentClass) {
      await this._router.navigate(['/']);
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

      await this.joinChannel(this.currentClass.firstSession, userId);
    } finally {
      mutexRelease();
    }

    this.setActiveSpeakerPolling();
    this.debouncedOnResize();

    this.analyticsService.send(GAEvent.userInfo, 0, 0);
  }

  ngOnDestroy() {
    if (this.isMusicPlaying) {
      this.audioFileTrack.stop();

      this.musicState = MusicState.STOPPED;
      this.isMusicPlaying = false;
    }

    this.leaveChannel();
    log.debug('Left agora channel');
    this._sessionStateService.close();

    this.unsubscribeAgoraService();
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
  async doToggleMicClick() {
    log.debug(`${this.localUser.isMicOn ? 'Unm' : 'M'}ute myself!`);
    try {
      if (this.localUser.isMicOn) {
        await this.localUser.micOff();
        this.analyticsService.send(GAEvent.micOn, 0, 0);
      } else {
        await this.localUser.micOn();
        this.analyticsService.send(GAEvent.micOn, 1, 100);
      }
      const eventType = this.localUser.isMicOn ? EventType.MicOn : EventType.MicOff;
      this.sendGlobalNotifyEvent(eventType);

      this.meetingUserInfos.find(user => user.meetingUserId === this._currentUserId);
    } catch (e) {
      log.debug('===== doToggleMicClick error: ', e);
    }
  }

  /**
   * Toggle Local camera(on/off)
   */
  async doToggleCameraClick() {
    log.debug(`${this.localUser.isCameraOn ? 'Enabled' : 'Disabled'} video!`);
    if (this.localUser) {
      try {
        if (this.localUser.isCameraOn) {
          await this.localUser.cameraOff();
          this.analyticsService.send(GAEvent.cameraOn, 0, 0);
        } else {
          await this.localUser.cameraOn();
          this.analyticsService.send(GAEvent.cameraOn, 1, 100);
        }
        const eventType = this.localUser.isCameraOn ? EventType.CameraOn : EventType.CameraOff;
        this.sendGlobalNotifyEvent(eventType);

        this.meetingUserInfos.find(user => user.meetingUserId === this._currentUserId);
      } catch (e) {
        log.debug('===== doToggleCameraClick error: ', e);
      }
    }
  }

  toggleRecording() {
    const globalEvent = new GlobalEvent(EventClass.Command, EventType.Record);
    globalEvent.subject = SERVER;
    globalEvent.target = this.isRecording ? ERecordEvent.PAUSE : ERecordEvent.ON;
    globalEvent.sessionId = this.sessionStateService.sessionAcronym;

    this.mediaChangedSource$.next(globalEvent);

    if (this.isRecording) {
      // Recording pause
      this.analyticsService.send(GAEvent.recordOn, 0, 0);
    } else {
      // Recording play
      this.analyticsService.send(GAEvent.recordOn, 1, 100);
    }
  }

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

      if (this.musicState === MusicState.PAUSED || this.musicState === MusicState.STOPPED) {
        // Music play
        this.analyticsService.send(GAEvent.play, 0, 0);
      } else {
        this.analyticsService.send(GAEvent.recordOn, 1, 100);
      }
    } else {
      log.debug('(music) Music not ready, waiting...');
      setTimeout(this.playMusic, 1000);
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

    this.playMusic();
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
    const lowStreamParameterName = this.isTheInstructor
      ? this.videoProfiles.instructor.low
      : this.videoProfiles.participant.low;
    const lowStreamParameter = LookupAgoraVideoProfile(lowStreamParameterName);
    this._agoraService.setLowStreamParameter({
      width: lowStreamParameter.width,
      height: lowStreamParameter.height,
      framerate: lowStreamParameter.frameRate,
      bitrate: lowStreamParameter.bitrate
    });

    if (this.localUser.meetingUser) {
      if (this.isTheInstructor) {
        this.localUser.meetingUser.mediaTrack.setVideoQuality(
          this.videoProfiles.instructor.high as VideoEncoderConfigurationPreset
        );
      } else {
        this.localUser.meetingUser.mediaTrack.setVideoQuality(
          this.videoProfiles.participant.high as VideoEncoderConfigurationPreset
        );
      }
    }
  }

  /**
   * Callback when a remote meeting user is added to the Agora ClassSession.
   *
   * Note that the meeting user is not played until we get the (on) subscribed
   * event from Agora
   */
  async addedMeetingUser(userType: MeetingUserType, user: any) {
    const userInfo: UserInfo = await this._userApiService.getUserByNumber$(user.uid).toPromise();
    const meetingUserInfo = this.findMeetingUser(userInfo.id) as MeetingUserInfo;
    if (meetingUserInfo) {
      const mutexRelease = await this.meetingUsersChangeMutex.acquire();
      try {
        meetingUserInfo.userInfo = userInfo;
        meetingUserInfo.meetingUserId = user.uid;
        meetingUserInfo.isJoined = true;
        if (userType === MeetingUserType.LOCAL) {
          meetingUserInfo.meetingUser = {
            type: MeetingUserType.LOCAL,
            mediaTrack: user.track,
            isHidden: meetingUserInfo.isHidden
          };
          meetingUserInfo.isSessionInactive = true;

          this.setVideoQuality();
          if (meetingUserInfo.videoOptimizationMode !== OptimizationMode.NONE) {
            meetingUserInfo.meetingUser.mediaTrack.setOptimizationMode(meetingUserInfo.videoOptimizationMode);
          }
        } else {
          meetingUserInfo.meetingUser = {
            type: MeetingUserType.REMOTE,
            user,
            isHidden: meetingUserInfo.isHidden
          };

          if (this.isTheInstructor) {
            meetingUserInfo.showControls = true;
          }

          this.reportRemoteUserStats();
        }
      } finally {
        mutexRelease();
      }

      // Request that the remote send their media status
      // const e = new GlobalEvent(EventClass.Command, EventType.MediaStatus);
      // let userId = '';
      // if (userInfo.token) {
      //   userId = userInfo.token && userInfo.token.sub;
      // } else if (userInfo.userData) {
      //   userId = userInfo.userData && userInfo.userData.user_id;
      // }
      // e.subject = userId;
      // e.sessionId = this.sessionStateService.sessionAcronym;
      // this.viewChangedSource$.next(e);

      // Send the media status.
      this.sendMediaStatus();
    }
  }

  /**
   * When a user leaves a channel, remove the agora user information as tracks
   * The video container is left unhidden if it is currently visible
   * Other attributes, such as mute and active speaker status, are cleared if
   * 'clearStatus' is set.
   */
  async removeMeetingUser(meetingUserId: number | string) {
    const mutexRelease = await this.meetingUsersChangeMutex.acquire();

    try {
      const currentUserIndex = this.meetingUserInfos.findIndex(user => user.meetingUserId === meetingUserId);
      if (currentUserIndex >= 0) {
        const currentUser = this.meetingUserInfos[currentUserIndex];
        currentUser.isJoined = false;
        currentUser.meetingUser = null;
        currentUser.showControls = false;

        currentUser.isMicOn = true;
        currentUser.isCameraOn = true;
        currentUser.isSpeaking = false;
        currentUser.qos = false;
      }
    } finally {
      mutexRelease();
    }
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
      this.addedMeetingUser(MeetingUserType.REMOTE, user).then(() => {});
    });
    this.subscriptions.push(remoteUserJoinedSub);

    const remoteUserLeaveSubs = this._agoraService.onRemoteUserLeft().subscribe(leftUser => {
      this.removeMeetingUser(leftUser.user.uid).then(() => {});
    });
    this.subscriptions.push(remoteUserLeaveSubs);

    const remoteUserChangeSubs = this._agoraService.onRemoteUsersStatusChange().subscribe(status => {
      switch (status.connectionState) {
        case 'CONNECTED':
          this.addedMeetingUser(MeetingUserType.REMOTE, status.user).then(() => {});

          this.analyticsService.send(GAEvent.connected, 1, 100);
          break;
        case 'DISCONNECTED':
          this.analyticsService.send(GAEvent.connected, 0, 0);
          break;
        case 'DISCONNECTING':
          this.analyticsService.send(GAEvent.reconnecting, 0, 0);
          break;
        case 'RECONNECTING':
          const currentUserIndex = this.meetingUserInfos.findIndex(user => user.meetingUserId === status.user.uid);
          if (currentUserIndex >= 0) {
            const isHidden = this.meetingUserInfos[currentUserIndex].isHidden;
            this.meetingUserInfos[currentUserIndex].meetingUser = {
              type: MeetingUserType.REMOTE,
              user: status.user,
              isHidden
            };

            this.analyticsService.send(GAEvent.reconnecting, 1, 100);
          }
          break;
      }
    });
    this.subscriptions.push(remoteUserChangeSubs);

    const localUserJoinedSubs = this._agoraService.onLocalUserJoined().subscribe(user => {
      this.addedMeetingUser(MeetingUserType.LOCAL, user).then(() => {});

      this.analyticsService.send(GAEvent.joined, 1, 100);
    });
    this.subscriptions.push(localUserJoinedSubs);

    const localNetworkQualitySubs = this._agoraService.onLocalNetworkQualityChange().subscribe(stats => {
      if (this.downlinkNetworkQuality !== stats.download || this.uplinkNetworkQuality !== stats.upload) {
        this.downlinkNetworkQuality = stats.download;
        this.uplinkNetworkQuality = stats.download;

        this.analyticsService.send(
          GAEvent.downlinkNetworkQuality,
          this.downlinkNetworkQuality,
          ((7 - ((this.downlinkNetworkQuality + 6) % 7)) / 7) * 100
        );
        this.analyticsService.send(
          GAEvent.uplinkNetworkQuality,
          this.uplinkNetworkQuality,
          ((7 - ((this.uplinkNetworkQuality + 6) % 7)) / 7) * 100
        );

        const rtcStats = this._agoraService.getClient().getRTCStats();
        if (rtcStats) {
          this.analyticsService.sendMili(GAEvent.duration, rtcStats.Duration, 10);
          this.analyticsService.sendMili(
            GAEvent.outgoingAvailableBandwidth,
            rtcStats.OutgoingAvailableBandwidth,
            50000
          );
          this.analyticsService.sendMili(GAEvent.rtt, rtcStats.RTT, 10000);
          this.analyticsService.sendMili(GAEvent.recvBitrate, rtcStats.RecvBitrate, 60000);
          this.analyticsService.sendMili(GAEvent.recvBytes, rtcStats.RecvBytes, 10000);
          this.analyticsService.sendMili(GAEvent.sendBitrate, rtcStats.SendBitrate, 60000);
          this.analyticsService.sendMili(GAEvent.sendBytes, rtcStats.SendBytes, 10000);
          this.analyticsService.sendMili(GAEvent.userCount, rtcStats.UserCount, 17);
        }
      }
    });

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
        const audioStats = meetingUserInfo.meetingUser.user.audioTrack.getStats();
        const videoStats = meetingUserInfo.meetingUser.user.videoTrack.getStats();

        if (audioStats) {
          this.analyticsService.sendMili(GAEvent.audioRoundTripLatency, audioStats.end2EndDelay, 10000, {
            session_remote_user_id: meetingUserInfo.meetingUser.user.uid
          });
          this.analyticsService.sendMili(GAEvent.audioReceiveLatency, audioStats.receiveDelay, 10000, {
            session_remote_user_id: meetingUserInfo.meetingUser.user.uid
          });
          this.analyticsService.sendMili(GAEvent.audioSendLatency, audioStats.transportDelay, 10000, {
            session_remote_user_id: meetingUserInfo.meetingUser.user.uid
          });
        }

        if (videoStats) {
          this.analyticsService.sendMili(GAEvent.videoRoundTripLatency, videoStats.end2EndDelay, 10000, {
            session_remote_user_id: meetingUserInfo.meetingUser.user.uid
          });
          this.analyticsService.sendMili(GAEvent.videoReceiveLatency, videoStats.receiveDelay, 10000, {
            session_remote_user_id: meetingUserInfo.meetingUser.user.uid
          });
          this.analyticsService.sendMili(GAEvent.videoSendLatency, videoStats.transportDelay, 10000, {
            session_remote_user_id: meetingUserInfo.meetingUser.user.uid
          });
        }
      }
    }
  }

  protected _onResize() {}

  /**
   * Clear the current speaker sampling interval
   */
  private clearCurrentSpeakerInterval(): void {
    if (this.pollSpeakerInterval) {
      clearInterval(this.pollSpeakerInterval);
      this.pollSpeakerInterval = undefined;
    }
  }

  /**
   * Activate/deactivate current speaker polling.
   */
  private setActiveSpeakerPolling(): void {
    // Clear any existing interval.
    this.clearCurrentSpeakerInterval();

    // Define the callback for each polling cycle
    const speakersEnabled =
      this.isTheInstructor || (environment.activeSpeaker.enabledFor === 'all' && !this.isSpotlighting);
    log.debug(`(speak) enabledFor:${environment.activeSpeaker.enabledFor} isSpotlighting:${this.isSpotlighting}`);
    const callback = () => {
      let count = environment.activeSpeaker.maxActive;
      this.localUser.isSpeaking =
        this.localUser.meetingUser &&
        speakersEnabled &&
        this.localUser.meetingUser.mediaTrack.getVolumeLevel() > environment.activeSpeaker.volumeThreashold;
      this.meetingUserInfos
        .filter((meetingUserInfo: MeetingUserInfo) => {
          return !meetingUserInfo.isLocalPreview;
        })
        .map((meetingUserInfo: MeetingUserInfo) => {
          // Get volume for each stream
          if (meetingUserInfo.isJoined) {
            return {
              volume: meetingUserInfo.meetingUser.user.audioTrack.getVolumeLevel(),
              meetingUserInfo
            };
          } else {
            return undefined;
          }
        })
        .sort((a: any, b: any) => {
          // Sort - instructor first, then by decreasing volume
          if (a.meetingUserInfo.isTheInstructor) {
            return -1;
          } else if (b.meetingUserInfo.isTheInstructor) {
            return 1;
          } else {
            return b.volume - a.volume;
          }
        })
        .forEach((item: any) => {
          // Mute/unmute as appropriate
          if (item && item.meetingUserInfo) {
            const hasSound = item.volume > environment.activeSpeaker.volumeThreashold;
            if (count > 0) {
              // This is still an active speaker, OR we don't have too many active speakers
              // Unmute the speaker if muted
              if (hasSound) {
                // Count the speaker
                count--;
                item.meetingUserInfo.isSpeaking = true;
              } else {
                item.meetingUserInfo.isSpeaking = false;
              }
              // log.debug(`(speak) Count:${count} isSpeaking:${item.streamInfo.isSpeaking} #${item.streamInfo.streamId}`)
              item.meetingUserInfo.uncancelAudio();
            } else {
              item.meetingUserInfo.isSpeaking = false;
              if (hasSound && !this.isTheInstructor) {
                item.meetingUserInfo.cancelAudio();
              } else {
                item.meetingUserInfo.uncancelAudio();
              }
            }
          }
        });
    };

    if (speakersEnabled) {
      log.debug('(speak) Setting interval (msec):', environment.activeSpeaker.sampleTimeMsec);
      this.pollSpeakerInterval = setInterval(callback, environment.activeSpeaker.sampleTimeMsec);
    } else {
      log.debug('(speak) Active Speaker DISABLED');
      // Make sure no active speaker or canceled audio
      this.meetingUserInfos.forEach((meetingUserInfo: MeetingUserInfo) => {
        meetingUserInfo.isSpeaking = false;
        meetingUserInfo.uncancelAudio().then(() => {});
      });
    }
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

  public getAnalyticsDimensions() {
    return {
      class_id: this.currentClass ? this.currentClass._id : '',
      class_name: this.currentClass ? this.currentClass.name : '',
      instructor_id: this.instructorId,
      participant_id: this._currentUserId,
      is_instructor: this.isTheInstructor
    };
  }
}
