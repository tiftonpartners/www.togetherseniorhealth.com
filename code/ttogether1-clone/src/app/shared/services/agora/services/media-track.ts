import {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  LocalVideoTrackStats,
  VideoEncoderConfiguration,
  VideoEncoderConfigurationPreset
} from 'agora-rtc-sdk-ng';
import { IMediaTrack } from '../core/media-track';
import { VideoOptimizationMode, VideoPlayerConfig } from '../agora.types';

export class MediaTrack implements IMediaTrack {
  private _cameraVideoTrack!: ICameraVideoTrack;
  private _microphoneAudioTrack: IMicrophoneAudioTrack;

  constructor(private track: [IMicrophoneAudioTrack, ICameraVideoTrack]) {
    this._microphoneAudioTrack = this.track[0];
    this._cameraVideoTrack = this.track[1];
  }

  public stop(): void {
    this._cameraVideoTrack.stop();
    this._cameraVideoTrack.close();
    this._microphoneAudioTrack.stop();
    this._microphoneAudioTrack.close();
  }

  public playVideo(element: string | HTMLElement, config?: VideoPlayerConfig): void {
    this._cameraVideoTrack.play(element, config);
  }

  public async microphoneMute(): Promise<void> {
    this._microphoneAudioTrack.setEnabled(false);
  }

  public async microphoneUnMute(): Promise<void> {
    this._microphoneAudioTrack.setEnabled(true);
  }

  public async cameraOff(): Promise<void> {
    this._cameraVideoTrack.setEnabled(false);
  }

  public async cameraOn(): Promise<void> {
    this._cameraVideoTrack.setEnabled(true);
  }

  public setVolume(volume: number): void {
    this._microphoneAudioTrack.setVolume(volume);
  }

  public getVolumeLevel(): number {
    return this._microphoneAudioTrack.getVolumeLevel();
  }

  public getStats(): LocalVideoTrackStats {
    return this._cameraVideoTrack.getStats();
  }

  public setVideoQuality(config: VideoEncoderConfiguration | VideoEncoderConfigurationPreset): void {
    this._cameraVideoTrack.setEncoderConfiguration(config);
  }

  public setOptimizationMode(mode: VideoOptimizationMode) {
    this._cameraVideoTrack.setOptimizationMode(mode);
  }

  public getAudioTrack(): IMicrophoneAudioTrack {
    return this._microphoneAudioTrack;
  }
}
