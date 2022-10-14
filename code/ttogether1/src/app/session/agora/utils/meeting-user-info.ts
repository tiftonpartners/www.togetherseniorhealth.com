import { UserInfo } from '@app/core/authentication/user.types';
import { Logger } from '@app/core';
import { User, VideoOptimizationMode } from '@app/shared/services/agora/agora.types';
import { IMediaTrack } from '@app/shared/services/agora/core';
import { OptimizationMode } from '@app/shared/services/agora/agora.consts';
import { RemoteStreamType } from 'agora-rtc-sdk-ng';

const log = new Logger('RemoteStreamInfo');

/**
 * The location and size of a video within its container
 * in the HTML
 */
export interface VideoLocation {
  top: number;
  left: number;
  width: number;
  height: number;
}

export enum MeetingUserType {
  LOCAL = 1,
  REMOTE = 2
}

export interface MeetingUser {
  type: MeetingUserType;
  user?: User; // Agora user
  mediaTrack?: IMediaTrack;
  isHidden: boolean; // Is the video currently hidden?
}

export default class MeetingUserInfo {
  meetingUserId: number | string = null;

  meetingUser: MeetingUser | null = null;

  userInfo: UserInfo | null = null; // Information about the associated user

  isTheInstructor = false; // Is this stream for the instructor of the session?
  isLocalPreview = false; // Is this showing a local preview?

  isJoined = false; // Is the remote user joined?
  isHidden = false; // Is the video currently hidden?
  isSessionInactive = false; // Is the session active (both streams not muted)

  isMicOn = true; // Mic on
  isCameraOn = true; // Camera on

  isAudioCancelled = false; // Audio paused by echo cancel
  isSpeaking = false;
  showControls = false; // Should we show any controls for this stream?
  showIndicators = false; // Should we show indicators?
  videoContainerId = ''; // HTML ID assigned to this video container.  Used to stream video.

  location: VideoLocation = null; // Assigned position & size of the element, if any

  helpWanted = false; // Have they requested help?
  qos = false; // Is there a QOS problem?
  remoteStreamType: RemoteStreamType = RemoteStreamType.HIGH_STREAM;

  /**
   * Is the current video on full screen?
   */
  isFocused = false;

  isSpotlight = false;

  /**
   * Video optimization mode for Agora
   */
  videoOptimizationMode: VideoOptimizationMode = OptimizationMode.DETAIL;

  constructor(meetingUser?: MeetingUser, userInfo?: UserInfo) {
    this.meetingUser = meetingUser;
    this.userInfo = userInfo;
    if (this.meetingUser) {
      this.meetingUserId = this.meetingUser.user.uid;
    }
  }

  setVolume(volume: number) {
    if (this.meetingUser && this.meetingUser.mediaTrack) {
      this.meetingUser.mediaTrack.setVolume(volume);
    }
  }

  async micOn() {
    if (this.meetingUser && this.meetingUser.mediaTrack) {
      await this.meetingUser.mediaTrack.setVolume(100);
      this.isMicOn = true;
    }
  }

  async micOff() {
    if (this.meetingUser && this.meetingUser.mediaTrack) {
      await this.meetingUser.mediaTrack.setVolume(0);
      this.isMicOn = false;
    }
  }

  async cameraOn() {
    if (this.meetingUser && this.meetingUser.mediaTrack) {
      await this.meetingUser.mediaTrack.cameraOn();
      this.isCameraOn = true;
    }
  }

  async cameraOff() {
    if (this.meetingUser && this.meetingUser.mediaTrack) {
      await this.meetingUser.mediaTrack.cameraOff();
      this.isCameraOn = false;
    }
  }

  /**
   * Apply echo cancellation
   */
  async cancelAudio() {
    if (this.meetingUser) {
      const before = !this.isMicOn || this.isAudioCancelled;
      this.isAudioCancelled = true;
      if (before !== (!this.isMicOn || this.isAudioCancelled)) {
        await this.setAudioMute();
      }
    }
  }

  /**
   * Remove echo cancel
   */
  async uncancelAudio() {
    if (this.meetingUser) {
      const before = !this.isMicOn || this.isAudioCancelled;
      this.isAudioCancelled = false;
      if (before !== (!this.isMicOn || this.isAudioCancelled)) {
        await this.setAudioMute();
      }
    }
  }

  private async setAudioMute() {
    if (this.meetingUser && this.meetingUser.mediaTrack) {
      if (this.isAudioCancelled || !this.isMicOn) {
        await this.meetingUser.mediaTrack.microphoneMute();
      } else {
        await this.meetingUser.mediaTrack.microphoneUnMute();
      }
    }
  }
}
