import { IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { IAudioTrack } from '../core/audio-track';

export class AudioTrack implements IAudioTrack {
  private _microphoneAudioTrack: IMicrophoneAudioTrack;

  constructor(private microphoneAudioTrack: IMicrophoneAudioTrack) {
    this._microphoneAudioTrack = this.microphoneAudioTrack;
  }

  public stop(): void {
    this._microphoneAudioTrack.stop();
    this._microphoneAudioTrack.close();
  }

  public async microphoneMute(): Promise<void> {
    await this._microphoneAudioTrack.setEnabled(false);
  }

  public async microphoneUnMute(): Promise<void> {
    await this._microphoneAudioTrack.setEnabled(true);
  }

  public setVolume(volume: number): void {
    this._microphoneAudioTrack.setVolume(volume);
  }

  public getVolumeLevel(): number {
    return this._microphoneAudioTrack.getVolumeLevel();
  }

  public getAudioTrack(): IMicrophoneAudioTrack {
    return this._microphoneAudioTrack;
  }
}
