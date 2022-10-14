import { Observable } from 'rxjs';
import { User, NetworkQuality, UserState } from '../agora.types';
import {
  IJoinChannel,
  IAudioTrack,
  IMediaTrack,
  IVideoTrack,
  IAudioJoinChannel,
  IVideoJoinChannel
} from './interfaces';

export interface INgxAgoraSdkNgService {
  join(channelName: string, token: string, uid?: string): IJoinChannel<IMediaTrack>;
  joinVideo(channelName: string, token: string, uid?: string): IVideoJoinChannel<IVideoTrack>;
  joinAudio(channelName: string, token: string, uid?: string): IAudioJoinChannel<IAudioTrack>;

  leave(): Promise<any>;

  getCameras(): Promise<MediaDeviceInfo[]>;
  getMicrophones(): Promise<MediaDeviceInfo[]>;
  getDevices(): Promise<MediaDeviceInfo[]>;

  onRemoteUsersStatusChange(): Observable<UserState>;
  onRemoteUserJoined(): Observable<User>;
  onRemoteUserLeft(): Observable<{ user: User; reason: string }>;
  onRemoteVolumeIndicator(): Observable<Array<{ level: number; uid: number | string }>>;

  onLocalNetworkQualityChange(): Observable<NetworkQuality>;
  onLocalUserJoined(): Observable<{ track: IMediaTrack }>;
  onLocalUserLeft(): Observable<{ user: User; reason: string }>;
}
