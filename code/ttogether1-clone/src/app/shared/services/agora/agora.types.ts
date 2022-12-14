import { RemoteAudioTrackStats, RemoteVideoTrackStats } from 'agora-rtc-sdk-ng';

export declare type CODEC = 'h264' | 'vp8';
export declare type MODE = 'live' | 'rtc';
export declare type ClientRole = 'audience' | 'host';
export declare type MediaType = 'video' | 'audio';
export declare type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'CONNECTED' | 'DISCONNECTING';
export declare type VideoOptimizationMode = 'balanced' | 'detail' | 'motion';

export enum LogLevel {
  DEBUG = 0,
  INFO,
  WARNING,
  ERROR,
  NONE
}

export class UserState {
  public connectionState!: ConnectionState;
  public mediaType?: MediaType;
  public user!: User;
}

export declare interface User {
  uid: number | string;
  audioTrack?: IRemoteAudioTrack;
  videoTrack?: IRemoteVideoTrack;
  hasAudio: boolean;
  hasVideo: boolean;
}

export declare interface IRemoteVideoTrack {
  play(element: string | HTMLElement, config?: VideoPlayerConfig): void;
  getMediaStream(): MediaStream;
  getStats(): RemoteVideoTrackStats;
  stop(): void;
}

export declare interface IRemoteAudioTrack {
  play(): void;
  setVolume(volume: number): void;
  getVolumeLevel(): number;
  getMediaStream(): MediaStream;
  getStats(): RemoteAudioTrackStats;
  stop(): void;
}

export declare interface VideoPlayerConfig {
  mirror?: boolean;
  fit?: 'cover' | 'contain' | 'fill';
}

export class IChannelConfig {
  token!: string;
  name!: string;
  uid?: number;
}

export declare interface NetworkQuality {
  /**
   * - 0: The quality is unknown.
   * - 1: The quality is excellent.
   * - 2: The quality is good, but the bitrate is less than optimal.
   * - 3: Users experience slightly impaired communication.
   * - 4: Users can communicate with each other, but not very smoothly.
   * - 5: The quality is so poor that users can barely communicate.
   * - 6: The network is disconnected and users cannot communicate.
   */
  upload: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * - 0: The quality is unknown.
   * - 1: The quality is excellent.
   * - 2: The quality is good, but the bitrate is less than optimal.
   * - 3: Users experience slightly impaired communication.
   * - 4: Users can communicate with each other, but not very smoothly.
   * - 5: The quality is so poor that users can barely communicate.
   * - 6: The network is disconnected and users cannot communicate.
   */
  download: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}
