import { AudioSourceOptions, IBufferSourceAudioTrack } from 'agora-rtc-sdk-ng';
import { IAudioFileTrack } from '../core/audio-file-track';

export class AudioFileTrack implements IAudioFileTrack {
  private _audioFileTrack: IBufferSourceAudioTrack;

  constructor(private audioFileTrack: IBufferSourceAudioTrack) {
    this._audioFileTrack = audioFileTrack;
  }

  public bufferSourceAudioTrack(): IBufferSourceAudioTrack {
    return this._audioFileTrack;
  }

  public play(audioSourceOptions?: AudioSourceOptions): void {
    this._audioFileTrack.play();
    this._audioFileTrack.startProcessAudioBuffer(audioSourceOptions);
  }

  public resume(): void {
    this._audioFileTrack.resumeProcessAudioBuffer();
  }

  public pause(): void {
    this._audioFileTrack.pauseProcessAudioBuffer();
  }

  public stop(): void {
    this._audioFileTrack.stopProcessAudioBuffer();
    this._audioFileTrack.stop();
  }

  public setVolume(volume: number): void {
    this._audioFileTrack.setVolume(volume);
  }

  public getVolumeLevel(): number {
    return this._audioFileTrack.getVolumeLevel();
  }
}
