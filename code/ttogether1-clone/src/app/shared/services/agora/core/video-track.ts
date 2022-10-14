import { LocalVideoTrackStats, VideoEncoderConfiguration, VideoEncoderConfigurationPreset } from 'agora-rtc-sdk-ng';
import { VideoOptimizationMode, VideoPlayerConfig } from '../agora.types';
import { ITrack } from './track';

export interface IVideoTrack extends ITrack {
  playVideo(element: string | HTMLElement, config?: VideoPlayerConfig): void;
  cameraOff(): Promise<void>;
  cameraOn(): Promise<void>;
  getStats(): LocalVideoTrackStats;
  setVideoQuality(config: VideoEncoderConfiguration | VideoEncoderConfigurationPreset): void;
  setOptimizationMode(mode: VideoOptimizationMode): void;
}
