import { AgoraInstructor } from './agora-instructor';
import { AgoraParticipant } from './agora-participant';

export default class UserType {
  static getUserType(isInstructor: boolean) {
    if (isInstructor) {
      return new AgoraInstructor();
    } else {
      return new AgoraParticipant();
    }
  }
}
