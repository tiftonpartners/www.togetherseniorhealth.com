import { IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { ITrack } from './track';

export interface IAudioTrack extends ITrack {
  microphoneMute(): Promise<void>;
  microphoneUnMute(): Promise<void>;
  setVolume(volume: number): void;
  getVolumeLevel(): number;
  getAudioTrack(): IMicrophoneAudioTrack;
}
