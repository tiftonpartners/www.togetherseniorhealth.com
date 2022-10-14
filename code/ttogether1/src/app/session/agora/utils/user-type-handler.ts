import {
  GlobalEvent,
  EventClass,
  IsMediaEvent,
  IsRecordingEvent,
  IsHelpEvent,
  ERecordEvent,
  EventType,
  IsMicEvent,
  IsVideoEvent,
  IsQosEvent,
  IsActiveSessionEvent,
  ANY_SUBJECT
} from '@app/evnt/global-events';
import { EClientView } from '@app/shared/interfaces';
import MeetingUserInfo, { MeetingUserType } from './meeting-user-info';
import { CredentialsService, Logger } from '@app/core';
import { environment } from '@env/environment';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AgoraService } from '@app/shared/services/agora/agora.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClassMusicFile, MusicApiService } from '../../sessions/music-api-service';
import { SessionStateService } from '../../sessions/session-state.service';
import { DefaultDialogComponent, DefaultDialogData } from '@app/shared/default-dialog/default-dialog.component';
import { Mutex } from 'async-mutex';
import { MatDialog } from '@angular/material/dialog';
import { ClassObject } from '../../sessions/class';
import { VideoEncoderConfigurationPreset } from 'agora-rtc-sdk-ng';
import { UserApiService } from '@app/core/authentication/user-api.service';
import { UserInfo } from '@app/core/authentication/user.types';
import { LookupAgoraVideoProfile } from './agora-video-constants';
import { OptimizationMode } from '@app/shared/services/agora/agora.consts';
import { sendGA } from '@app/analytics/analytics.service';

const log = new Logger('SocketHandlerClass');

export interface TypeHandleMute {
  micEvt: 'micOn' | 'micOff';
  volume?: number;
  notice: GlobalEvent;
  noticeEvt: EventType;
  globalEvt: EventType;
  gaValue?: number;
  gaPercentage?: number;
}

export interface TypeAgora {
  currentUserId: string;
  agoraService: AgoraService;
  credentialService: CredentialsService;
  localUser: MeetingUserInfo;
  router: Router;
  mediaChangedSource$: Subject<GlobalEvent>;
  meetingUserInfos: MeetingUserInfo[];
  getSnackBar: MatSnackBar;
  snackBarRef: any;
  musicVolume: number;
  musicApiService: MusicApiService;
  selectedMusic: ClassMusicFile | undefined;
  currentView: EClientView;
  videoProfiles: typeof environment.videoProfiles;
  sessionStateService: SessionStateService;
  viewChangedSource$: Subject<GlobalEvent>;
  meetingUsersChangeMutex: Mutex;
  isSpotlighting: boolean;
  askedForHelp: boolean;
  dialog: MatDialog;
  currentClass: ClassObject;
  userApiService: UserApiService;
  doToggleMicClick: () => Promise<void>;
  doToggleCameraClick: () => Promise<void>;
  handleMute: (obj: TypeHandleMute) => Promise<void>;
  handleMusicStatus: (target: string) => void;
  setMusicVolume: (volume: number) => void;
  handleHelpWanted: (notice: GlobalEvent, target: string) => void;
  setIsRecording: (value: boolean) => void;
  setHelpMessage: (evt: GlobalEvent) => void;
  setMusicFiles: (musicFiles: ClassMusicFile[]) => void;
  setSelectedMusic: (selectedMusic: ClassMusicFile | undefined) => void;
  setReadyForMusic: (readyForMusic: boolean) => void;
  setSnackBarRef: (snackBarRef: any) => void;
  setCurrentView: (view: EClientView) => void;
  setIsSpotlighting: (value: boolean) => void;
  setLocalUser: (localUser: MeetingUserInfo) => void;
  debouncedOnResize: () => {};
  reportRemoteUserStats: () => void;
  showMeetingUser: (meetingUserInfo: MeetingUserInfo) => void;
  hideMeetingUser: (meetingUserInfo: MeetingUserInfo) => void;
  setCurrentSpotlightUserId: (id: string) => void;
  refreshPage: () => void;
}

export interface IUserTypeHandler {
  evt: GlobalEvent;
  agora: TypeAgora;
  handler: (evt: GlobalEvent, agora: TypeAgora) => Promise<void>;
  setRemoteVideoStreamType: (data: any, agora: TypeAgora) => Promise<void>;
  initMusic: (agora: TypeAgora) => void;
  overrideVideoQuality: (currentView: EClientView, videoQuality: string) => string;
  getLowStreamParameterName: () => string;
  endClass: (agora: TypeAgora) => void;
  endClassByType: (agora: TypeAgora, sessionLeaveUrl: string) => void;
  switchToSpotlight: (userId: string) => Promise<void>;
  switchToSpotlightByType: (agora: TypeAgora, meetingUserInfo: MeetingUserInfo, userId: string) => void;
  switchToInstructor: (agora: TypeAgora) => void;
  switchToInstructorByType: (agora: TypeAgora, meetingUserInfo: MeetingUserInfo) => void;
  switchToGroup: () => Promise<void>;
  setActiveSpeakerPolling: (agora: TypeAgora) => void;
  findMeetingUser: (userId: string, meetingUserInfos: MeetingUserInfo[]) => MeetingUserInfo | null;
  sendMediaStatus: () => void;
  doVideoSizeSelected: (displayLayout: string) => void;
  getVideoProfile: () => { low: string; high: string };
  setVideoQuality: (agora: TypeAgora) => void;
  addedMeetingUser: (agora: TypeAgora, userType: MeetingUserType, user: any) => Promise<void>;
  removeMeetingUser: (agora: TypeAgora, meetingUserId: number | string) => Promise<void>;
  doClearHelp: (agora: TypeAgora, userId: string) => void;
  verifyIfObserver: (participants: string[], userId: string) => boolean;
  getDialogData: () => DefaultDialogData;
  enableSpeakers: (isSpotlighting: boolean) => boolean;
}

export class UserTypeHandler implements IUserTypeHandler {
  evt: GlobalEvent;
  agora: TypeAgora;
  pollSpeakerInterval: NodeJS.Timeout;

  async handler(evt: GlobalEvent, agora: TypeAgora) {
    this.evt = evt;
    this.agora = agora;
    const isNotify = evt.eventClass === EventClass.Notify;
    const isCommand = evt.eventClass === EventClass.Command;
    if (isNotify && this.evt.subject !== this.agora.currentUserId) {
      this.notify();
    }

    if (isCommand && (this.evt.subject === this.agora.currentUserId || this.evt.subject === ANY_SUBJECT)) {
      // This event will notify on the completed event
      const notice: GlobalEvent = new GlobalEvent(EventClass.Notify, EventType.Unknown);
      notice.sessionId = this.evt.sessionId;
      notice.subject = this.agora.credentialService.credentials.sub;

      switch (this.evt.event) {
        case EventType.MicOn:
        case EventType.MicOff:
          await this.agora.doToggleMicClick();
          break;

        case EventType.CameraOn:
        case EventType.CameraOff:
          await this.agora.doToggleCameraClick();
          break;

        case EventType.MediaStatus:
          this.sendMediaStatus();
          break;

        case EventType.MuteMicAll:
          await this.agora.handleMute({
            micEvt: 'micOff',
            notice,
            noticeEvt: EventType.MuteMicAll,
            globalEvt: EventType.MicOff,
            gaValue: 1,
            gaPercentage: 100
          });
          break;

        case EventType.UnmuteMicAll:
          await this.agora.handleMute({
            micEvt: 'micOn',
            volume: environment.defaultVolume,
            notice,
            noticeEvt: EventType.UnmuteMicAll,
            globalEvt: EventType.MicOn
          });
          break;
      }

      switch (this.evt.event) {
        case EventType.Navigate:
        case EventType.NavigateAll:
          log.debug(`(evt) Navigating to:"${this.evt.target}`);
          this.agora.router.navigate([this.evt.target]);
          break;

        case EventType.ChangeView:
        case EventType.ChangeViewAll:
          log.debug(`(evt) Changing view to:"${this.evt.target}"`);

          // Keep other changes to remote state from happening
          // while we switch views
          if (this.evt.target.startsWith('spot')) {
            const userId = this.evt.target.substr(5);
            this.doVideoSizeSelected('spotlight');
            await this.switchToSpotlight(userId);
          } else if (this.evt.target === EClientView.GROUP) {
            this.doVideoSizeSelected(this.evt.target);
            this.switchToGroup();
          } else if (this.evt.target === EClientView.INSTRUCTOR) {
            this.doVideoSizeSelected(this.evt.target);
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
          this.agora.handleMusicStatus(this.evt.target);
          break; // End, EventType.Music

        case EventType.MusicVolume:
          this.agora.setMusicVolume(this.evt.target);
          break;

        case EventType.HelpWanted:
          this.agora.handleHelpWanted(notice, this.evt.target);
          break;

        case EventType.SetHelpMessage:
          this.agora.setHelpMessage(this.evt);
          break;

        case EventType.StartOver:
          this.agora.refreshPage();
          log.debug('(evt) startOver');
          break;
      }

      // Send out notice of the change, if any
      if (notice.event !== EventType.Unknown) {
        this.agora.mediaChangedSource$.next(notice);
      }
    }
  }

  /**
   * Click action for when the remote video stream type is changed for a specific video
   */
  async setRemoteVideoStreamType(data: any, agora: TypeAgora) {}

  initMusic(agora: TypeAgora) {}

  /** if not instructor just return videoQuality */
  overrideVideoQuality(currentView: EClientView, videoQuality: string) {
    return videoQuality;
  }

  getLowStreamParameterName() {
    return '';
  }

  verifyIfObserver(participants: string[], userId: string) {
    return false;
  }

  endClass(agora: TypeAgora) {
    const { userInfo: { isAnInstructor = false } = {} } = agora.localUser;
    const data: DefaultDialogData = this.getDialogData();

    const dialogRef = agora.dialog.open(DefaultDialogComponent, {
      panelClass: 'position-relative',
      data
    });

    dialogRef.afterClosed().subscribe((result: string) => {
      const realResult = Number(result);
      const sessionLeaveUrl = `/session/leave/${agora.currentClass.acronym}`;

      switch (realResult) {
        case 1: // Leave Class
          agora.router.navigate([sessionLeaveUrl]);
          break;
        case 2: // End Class
          this.endClassByType(agora, sessionLeaveUrl);
          agora.router.navigate([sessionLeaveUrl]);
          break;
        case 0:
        default:
          break;
      }
    });
  }

  endClassByType(agora: TypeAgora, sessionLeaveUrl: string) {}

  /**
   * Spotlight a specific user, turning off the video view of
   * all other users
   *
   * @param userId User ID who's video is to be spotlighted
   */
  @sendGA('spotlightEvent', [1, 100])
  async switchToSpotlight(userId: string) {
    log.debug('(switchToSpotlight) user:', userId);
    this.agora.currentView = EClientView.SPOTLIGHT;
    this.agora.isSpotlighting = true;
    this.agora.setCurrentSpotlightUserId(userId);

    const mutexRelease = await this.agora.meetingUsersChangeMutex.acquire();
    try {
      this.agora.meetingUserInfos.forEach(meetingUserInfo => {
        meetingUserInfo.isSpotlight = meetingUserInfo.userInfo.id === userId || meetingUserInfo.isTheInstructor;
        this.switchToSpotlightByType(this.agora, meetingUserInfo, userId);
      });
      this.setActiveSpeakerPolling(this.agora);
    } finally {
      mutexRelease();
    }

    this.agora.debouncedOnResize();
  }

  switchToSpotlightByType(agora: TypeAgora, meetingUserInfo: MeetingUserInfo, userId: string) {}

  /**
   * Switch to Instructor view - spotlighting the instructor only
   */
  @sendGA('spotlightView', [1, 100])
  async switchToInstructor() {
    this.agora.setCurrentView(EClientView.INSTRUCTOR);
    this.agora.setIsSpotlighting(true);
    this.agora.setCurrentSpotlightUserId(undefined);

    const mutexRelease = await this.agora.meetingUsersChangeMutex.acquire();
    try {
      this.agora.meetingUserInfos.forEach(meetingUserInfo => {
        meetingUserInfo.isSpotlight = meetingUserInfo.isTheInstructor;
        this.switchToInstructorByType(this.agora, meetingUserInfo);
      });
      this.setActiveSpeakerPolling(this.agora);
    } finally {
      mutexRelease();
    }

    this.agora.debouncedOnResize();
  }

  switchToInstructorByType(agora: TypeAgora, meetingUserInfo: MeetingUserInfo) {}

  /**
   * Switch to Group view - showing all users
   */
  @sendGA('groupView', [1, 100])
  async switchToGroup() {
    log.debug('(switchToGroup)');

    const mutexRelease = await this.agora.meetingUsersChangeMutex.acquire();
    try {
      this.agora.setCurrentView(EClientView.GROUP);
      this.agora.setCurrentSpotlightUserId(undefined);
      this.agora.setIsSpotlighting(false);

      this.agora.meetingUserInfos.forEach(remoteStream => {
        remoteStream.isSpotlight = false;
        this.agora.showMeetingUser(remoteStream);
      });
      this.setActiveSpeakerPolling(this.agora);
    } finally {
      mutexRelease();
    }

    this.agora.debouncedOnResize();
  }

  getDialogData() {
    return {
      title: 'Please Confirm',
      message: 'Do you want to leave class?',
      leaveButton: 'Leave',
      cancelButton: 'Cancel'
    };
  }

  enableSpeakers(isSpotlighting: boolean) {
    return false;
  }

  setActiveSpeakerPolling(agora: TypeAgora) {
    // Clear any existing interval.
    this.clearCurrentSpeakerInterval();

    // Define the callback for each polling cycle
    const speakersEnabled = this.enableSpeakers(agora.isSpotlighting);
    log.debug(`(speak) enabledFor:${environment.activeSpeaker.enabledFor} isSpotlighting:${agora.isSpotlighting}`);
    const callback = () => {
      let count = environment.activeSpeaker.maxActive;
      agora.localUser.isSpeaking =
        agora.localUser.meetingUser &&
        speakersEnabled &&
        agora.localUser.meetingUser.mediaTrack.getVolumeLevel() > environment.activeSpeaker.volumeThreashold;
      agora.setLocalUser(agora.localUser);
      agora.meetingUserInfos
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
              this.switchCancel(item, hasSound);
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
      agora.meetingUserInfos.forEach((meetingUserInfo: MeetingUserInfo) => {
        meetingUserInfo.isSpeaking = false;
        meetingUserInfo.uncancelAudio();
      });
    }
  }

  switchCancel(item: any, hasSound: boolean) {
    if (hasSound) {
      item.meetingUserInfo.cancelAudio();
    } else {
      item.meetingUserInfo.uncancelAudio();
    }
  }

  /**
   * Find a meeting user in the current joined
   */
  findMeetingUser(userId: string, meetingUserInfos: MeetingUserInfo[]): MeetingUserInfo | null {
    if (!meetingUserInfos || !meetingUserInfos.length) {
      return null;
    }

    return meetingUserInfos.find(meetingUserInfo => {
      return meetingUserInfo.userInfo && meetingUserInfo.userInfo.id === userId;
    });
  }

  // Send the state of the current media buttons over the
  // global event bus
  sendMediaStatus() {
    if (!this.agora.localUser) {
      return;
    }
    const isMutedEvent = new GlobalEvent(
      EventClass.Notify,
      this.agora.localUser.isMicOn ? EventType.MicOn : EventType.MicOff
    );
    isMutedEvent.subject = this.agora.credentialService.credentials.sub;
    isMutedEvent.sessionId = this.agora.sessionStateService.sessionAcronym;
    this.agora.mediaChangedSource$.next(isMutedEvent);

    const isVideoMutedEvent = new GlobalEvent(
      EventClass.Notify,
      this.agora.localUser.isCameraOn ? EventType.CameraOn : EventType.CameraOff
    );
    isVideoMutedEvent.subject = this.agora.credentialService.credentials.sub;
    isVideoMutedEvent.sessionId = this.agora.sessionStateService.sessionAcronym;
    this.agora.mediaChangedSource$.next(isVideoMutedEvent);

    // Are we asking for help?
    const helpEvent = new GlobalEvent(EventClass.Notify, EventType.HelpWanted);
    helpEvent.subject = this.agora.credentialService.credentials.sub;
    helpEvent.sessionId = this.agora.sessionStateService.sessionAcronym;
    helpEvent.target = this.agora.askedForHelp ? 'on' : 'off';
    this.agora.mediaChangedSource$.next(helpEvent);
  }

  /**
   * The selected video size
   */
  doVideoSizeSelected(displayLayout: string) {
    if (this.agora.localUser && this.agora.localUser.meetingUser && this.agora.localUser.meetingUser.mediaTrack) {
      // const lowStreamParameter = LookupAgoraVideoProfile(lowStreamParameterName);
      const profile = this.getVideoProfile();
      let videoQuality: VideoEncoderConfigurationPreset = profile.low as VideoEncoderConfigurationPreset;
      switch (displayLayout) {
        case EClientView.GROUP:
          videoQuality = profile.low as VideoEncoderConfigurationPreset;
          break;
        case 'spotlight':
        case EClientView.INSTRUCTOR:
          videoQuality = profile.high as VideoEncoderConfigurationPreset;
          break;
      }
      console.log('===== Setting video quality =====', videoQuality);
      this.agora.localUser.meetingUser.mediaTrack.setVideoQuality(videoQuality);
    }
  }

  getVideoProfile() {
    return { low: '', high: '' };
  }

  /**
   * Set video quality for the local user
   */
  setVideoQuality(agora: TypeAgora) {
    const lowStreamParameterName = this.getLowStreamParameterName();
    const lowStreamParameter = LookupAgoraVideoProfile(lowStreamParameterName);
    agora.agoraService.setLowStreamParameter({
      width: lowStreamParameter.width,
      height: lowStreamParameter.height,
      framerate: lowStreamParameter.frameRate,
      bitrate: lowStreamParameter.bitrate
    });

    if (agora.localUser.meetingUser) {
      /** check if in group, so we can use low to reduce bandwidth (participant) */
      let videoQuality =
        agora.currentView === EClientView.GROUP
          ? agora.videoProfiles.participant.low
          : agora.videoProfiles.participant.high;

      videoQuality = this.overrideVideoQuality(agora.currentView, videoQuality);

      agora.localUser.meetingUser.mediaTrack.setVideoQuality(videoQuality as VideoEncoderConfigurationPreset);
    }
  }

  /**
   * Callback when a remote meeting user is added to the Agora ClassSession.
   *
   * Note that the meeting user is not played until we get the (on) subscribed
   * event from Agora
   */
  async addedMeetingUser(agora: TypeAgora, userType: MeetingUserType, user: any) {
    const userInfo: UserInfo = await agora.userApiService.getUserByNumber$(user.uid).toPromise();
    const meetingUserInfo = this.findMeetingUser(userInfo.id, agora.meetingUserInfos) as MeetingUserInfo;
    if (meetingUserInfo) {
      const mutexRelease = await agora.meetingUsersChangeMutex.acquire();
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

          this.setVideoQuality(agora);
          if (meetingUserInfo.videoOptimizationMode !== OptimizationMode.NONE) {
            meetingUserInfo.meetingUser.mediaTrack.setOptimizationMode(meetingUserInfo.videoOptimizationMode);
          }
        } else {
          meetingUserInfo.meetingUser = {
            type: MeetingUserType.REMOTE,
            user,
            isHidden: meetingUserInfo.isHidden
          };

          meetingUserInfo.showControls = this.setShowControls(meetingUserInfo.showControls);

          agora.reportRemoteUserStats();
        }
      } finally {
        mutexRelease();
      }

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
  async removeMeetingUser(agora: TypeAgora, meetingUserId: number | string) {
    const mutexRelease = await agora.meetingUsersChangeMutex.acquire();

    try {
      const currentUserIndex = agora.meetingUserInfos.findIndex(user => user.meetingUserId === meetingUserId);
      if (currentUserIndex >= 0) {
        const currentUser = agora.meetingUserInfos[currentUserIndex];
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

  setShowControls(currentShowControls: boolean) {
    return currentShowControls;
  }

  /**
   * Clear help for a user
   */
  doClearHelp(agora: TypeAgora, userId: string) {
    log.debug('(doClearHelp)');
    const meetingUser = this.findMeetingUser(userId, agora.meetingUserInfos);
    if (meetingUser) {
      const globalEvent = new GlobalEvent(EventClass.Command, EventType.HelpWanted);
      globalEvent.subject = userId;
      globalEvent.target = 'off';
      globalEvent.sessionId = agora.sessionStateService.sessionAcronym;
      log.debug('(doClearHelp) Sending Event:', globalEvent.toFriendly());
      agora.mediaChangedSource$.next(globalEvent);
    }
  }

  /**
   * Clear the current speaker sampling interval
   */
  private clearCurrentSpeakerInterval(): void {
    if (this.pollSpeakerInterval) {
      clearInterval(this.pollSpeakerInterval);
      this.pollSpeakerInterval = undefined;
    }
  }

  /*
   * Handle notify events
   */
  private notify() {
    if (IsMediaEvent(this.evt.event)) {
      this.handleMediaEvent(this.agora.meetingUserInfos);
    } else if (IsRecordingEvent(this.evt.event)) {
      this.agora.setIsRecording(this.evt.target === ERecordEvent.ON);
    } else if (IsHelpEvent(this.evt.event)) {
      const meetingUser = this.findMeetingUser(this.evt.subject, this.agora.meetingUserInfos);
      if (meetingUser) {
        meetingUser.helpWanted = this.evt.target === 'on';
      }
    }
  }

  /**
   * Handle media events
   * @param evt The event to handle.
   */
  private handleMediaEvent(meetingUserInfos: MeetingUserInfo[]) {
    log.debug('(evt) IsMediaEvent:', JSON.stringify(this.evt.toFriendly()));
    // We need to reflect this event in the UI
    for (const meetingUserInfo of meetingUserInfos) {
      if (meetingUserInfo.userInfo.id === this.evt.subject) {
        log.debug('(evt) Subject matches:', meetingUserInfo.userInfo.id);
        if (IsMicEvent(this.evt.event)) {
          if (this.evt.event === EventType.MicOn) {
            meetingUserInfo.isMicOn = true;
          } else if (this.evt.event === EventType.MicOff) {
            meetingUserInfo.isMicOn = false;
          }
        } else if (IsVideoEvent(this.evt.event)) {
          if (this.evt.event === EventType.CameraOn) {
            meetingUserInfo.isCameraOn = true;
          } else if (this.evt.event === EventType.CameraOff) {
            meetingUserInfo.isCameraOn = false;
          }
        } else if (IsQosEvent(this.evt.event)) {
          meetingUserInfo.qos = this.evt.target === 'on';
        } else if (IsActiveSessionEvent(this.evt.event)) {
          log.debug('(evt) Active Session Event:', this.evt);
          switch (this.evt.event) {
            case EventType.SessionInactive:
              // Session is inactive - mark as such
              meetingUserInfo.isSessionInactive = true;
              log.debug('(evt) (sessionInactive) Session is INACTIVE');
              break;

            case EventType.SessionActive:
              meetingUserInfo.isSessionInactive = false;
              // The target gives the current media status.
              // Can be JSON as a string, or just JSON
              let target = this.evt.target;
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
  }
}
