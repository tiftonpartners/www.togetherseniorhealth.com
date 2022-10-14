import { GlobalEvent } from '@app/evnt/global-events';
import { UserTypeHandler, TypeAgora } from './user-type-handler';
import MeetingUserInfo from '../utils/meeting-user-info';
import { environment } from '@env/environment';
import { Logger } from '@app/core';

const log = new Logger('AgoraInstructorClass');

export class AgoraParticipant extends UserTypeHandler {
  async handler(evt: GlobalEvent, agora: TypeAgora): Promise<void> {
    await super.handler(evt, agora);
  }

  getLowStreamParameterName() {
    return environment.videoProfiles.participant.low;
  }

  // We are an observer if we aren't the instructor and we are not a participant
  verifyIfObserver(participants: string[], userId: string) {
    return (
      participants.reduce((acc: string, currentValue: string): string => {
        return acc === 'false' ? 'false' : currentValue === userId ? 'false' : 'true';
      }, 'true') === 'true'
    );
  }

  switchToSpotlightByType(agora: TypeAgora, meetingUserInfo: MeetingUserInfo, userId: string) {
    if (meetingUserInfo.userInfo.id === userId || meetingUserInfo.isTheInstructor) {
      // I'm being spotlighted - how exciting!
      meetingUserInfo.isSpotlight = true;
      agora.showMeetingUser(meetingUserInfo);
    } else {
      agora.hideMeetingUser(meetingUserInfo);
      meetingUserInfo.isSpotlight = false;
    }
  }

  async switchToInstructor() {
    log.debug(`(switchToInstructor) isTheInstructor:${false}`);
    await super.switchToInstructor();
  }

  switchToInstructorByType(agora: TypeAgora, meetingUserInfo: MeetingUserInfo) {
    if (meetingUserInfo.isTheInstructor) {
      agora.setCurrentSpotlightUserId(meetingUserInfo.userInfo.id);
      agora.showMeetingUser(meetingUserInfo);
    } else {
      agora.hideMeetingUser(meetingUserInfo);
    }
  }

  enableSpeakers(isSpotlighting: boolean): boolean {
    return environment.activeSpeaker.enabledFor === 'all' && !isSpotlighting;
  }

  getVideoProfile() {
    return environment.videoProfiles.participant;
  }
}
