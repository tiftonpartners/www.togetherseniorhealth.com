import { AudioSourceOptions, IBufferSourceAudioTrack } from 'agora-rtc-sdk-ng';

export interface IAudioFileTrack {
  bufferSourceAudioTrack(): IBufferSourceAudioTrack;
  play(audioSourceOptions?: AudioSourceOptions): void;
  resume(): void;
  pause(): void;
  stop(): void;
  setVolume(volume: number): void;
  getVolumeLevel(): number;
}
