import { GlobalEvent } from '@app/evnt/global-events';
import { UserTypeHandler, TypeAgora } from './user-type-handler';
import { IsForAllParticipants, EventClass, EventType, ANY_SUBJECT } from '@app/evnt/global-events';
import { Logger } from '@app/core';
import { RemoteStreamType } from 'agora-rtc-sdk-ng';
import { environment } from '@env/environment';
import { ClassMusicFile } from '../../sessions/music-api-service';
import { EClientView } from '@app/shared/interfaces';

const log = new Logger('AgoraInstructorClass');

export class AgoraInstructor extends UserTypeHandler {
  async handler(evt: GlobalEvent, agora: TypeAgora) {
    // (evt) Handling Global Event:log.debug('(evt) Handling Global Event:', JSON.stringify(evt.toFriendly()));
    if (IsForAllParticipants(evt.event)) {
      log.debug('(evt) Instructor ignores:', JSON.stringify(evt.toFriendly()));
      return;
    }

    await super.handler(evt, agora);
  }

  /**
   * Click action for when the remote video stream type is changed for a specific video
   */
  async setRemoteVideoStreamType(data: any, agora: TypeAgora) {
    const userId = data.userId;
    const remoteStreamType = data.remoteStreamType as RemoteStreamType;

    if (userId) {
      if (remoteStreamType === RemoteStreamType.HIGH_STREAM) {
        for (const meetingUserInfo of agora.meetingUserInfos) {
          if (meetingUserInfo.meetingUser && !meetingUserInfo.isLocalPreview) {
            if (meetingUserInfo.userInfo.id === userId) {
              await agora.agoraService.setRemoteVideoStreamType(meetingUserInfo.meetingUser.user.uid, remoteStreamType);
              meetingUserInfo.remoteStreamType = remoteStreamType;
            } else {
              await agora.agoraService.setRemoteVideoStreamType(
                meetingUserInfo.meetingUser.user.uid,
                RemoteStreamType.LOW_STREAM
              );
              meetingUserInfo.remoteStreamType = RemoteStreamType.LOW_STREAM;
            }
          }
        }
      } else {
        const meetingUserInfo = this.findMeetingUser(userId, this.agora.meetingUserInfos);
        if (meetingUserInfo && meetingUserInfo.meetingUser) {
          await agora.agoraService.setRemoteVideoStreamType(meetingUserInfo.meetingUser.user.uid, remoteStreamType);
          meetingUserInfo.remoteStreamType = remoteStreamType;
        }
      }
    }
  }

  initMusic(agora: TypeAgora) {
    if (!environment.disableAv) {
      agora.setSnackBarRef(agora.getSnackBar.open('Loading music...', 'Ok'));
      log.debug('(music) Volume Level:', agora.musicVolume);

      agora.musicApiService.getMusicFiles().subscribe((musicFiles: ClassMusicFile[]) => {
        // Select one music file, as determined by the
        // environment variable, or failing that choose the first.
        if (musicFiles && musicFiles.length > 0) {
          agora.setMusicFiles(musicFiles);
          agora.setSelectedMusic(musicFiles[0]);
          musicFiles.forEach((musicFile: ClassMusicFile) => {
            if (musicFile.title === environment.defaultSong) {
              agora.setSelectedMusic(musicFile);
            }
          });
          log.debug('(ngOnInit) Music File:', JSON.stringify(agora.selectedMusic, null, 2));
        } else {
          log.error('ERROR: No Class Music File');
        }
        agora.setReadyForMusic(true);
        if (agora.snackBarRef) {
          agora.snackBarRef.dismiss();
          agora.setSnackBarRef(undefined);
        }
      });
    }
  }

  /** if instructor then override videoQuality */
  overrideVideoQuality(currentView: EClientView) {
    /** check if in group, so we can use low to reduce bandwidth (instructor) */
    const videoQuality =
      currentView === EClientView.GROUP
        ? environment.videoProfiles.instructor.low
        : environment.videoProfiles.instructor.high;

    return videoQuality;
  }

  getLowStreamParameterName() {
    return environment.videoProfiles.instructor.low;
  }

  endClassByType(agora: TypeAgora, sessionLeaveUrl: string) {
    const evt = new GlobalEvent(EventClass.Command, EventType.NavigateAll);
    evt.subject = ANY_SUBJECT;
    evt.sessionId = agora.sessionStateService.sessionAcronym;
    evt.target = sessionLeaveUrl;
    agora.viewChangedSource$.next(evt);
  }

  getDialogData() {
    return {
      title: 'Please Confirm',
      message: 'Do you want to leave, end class?',
      leaveButton: 'Leave',
      cancelButton: 'Cancel',
      endButton: 'End'
    };
  }

  enableSpeakers(isSpotlighting: boolean) {
    return true;
  }

  switchCancel(item: any): void {
    item.meetingUserInfo.uncancelAudio();
  }

  getVideoProfile() {
    return environment.videoProfiles.instructor;
  }

  setShowControls(currentShowControls: boolean) {
    return true;
  }

  async switchToInstructor() {
    log.debug(`(switchToInstructor) isTheInstructor:${true}`);
    await super.switchToInstructor();
  }
}
