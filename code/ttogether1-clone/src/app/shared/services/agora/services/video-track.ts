import {
  ICameraVideoTrack,
  LocalVideoTrackStats,
  VideoEncoderConfiguration,
  VideoEncoderConfigurationPreset
} from 'agora-rtc-sdk-ng';
import { IVideoTrack } from '../core/video-track';
import { VideoOptimizationMode, VideoPlayerConfig } from '../agora.types';

export class VideoTrack implements IVideoTrack {
  private _cameraVideoTrack: ICameraVideoTrack;

  constructor(private cameraVideoTrack: ICameraVideoTrack) {
    this._cameraVideoTrack = this.cameraVideoTrack;
  }

  public stop(): void {
    this._cameraVideoTrack.stop();
    this._cameraVideoTrack.close();
  }

  public playVideo(element: string | HTMLElement, config?: VideoPlayerConfig): void {
    this._cameraVideoTrack.play(element, config);
  }

  public async cameraOff(): Promise<void> {
    await this._cameraVideoTrack.setEnabled(false);
  }

  public async cameraOn(): Promise<void> {
    await this._cameraVideoTrack.setEnabled(true);
  }

  public getStats(): LocalVideoTrackStats {
    return this._cameraVideoTrack.getStats();
  }

  public setVideoQuality(config: VideoEncoderConfiguration | VideoEncoderConfigurationPreset) {
    this._cameraVideoTrack.setEncoderConfiguration(config);
  }

  public setOptimizationMode(mode: VideoOptimizationMode) {
    this._cameraVideoTrack.setOptimizationMode(mode);
  }
}
