import { EventEmitter, Inject, Injectable } from '@angular/core';
import AgoraRTC, {
  IAgoraRTCClient,
  IBufferSourceAudioTrack,
  LowStreamParameter,
  RemoteStreamType,
  UID
} from 'agora-rtc-sdk-ng';
import { Observable } from 'rxjs';
import { JoinAudioChannel, JoinChannel, JoinVideoChannel } from './services/channel';
import { AgoraConfig } from './agora.config';

import {
  IAudioTrack,
  IJoinChannel,
  IMediaTrack,
  IVideoTrack,
  IVideoJoinChannel,
  IAudioJoinChannel,
  IAudioFileJoinChannel
} from './core/interfaces';

import { User, NetworkQuality, UserState } from './agora.types';
import { IAudioFileTrack } from './core/audio-file-track';
import { JoinAudioFileChannel } from './services/join-audio-file-channel';

@Injectable({
  providedIn: 'root'
})
export class AgoraService {
  private client!: IAgoraRTCClient;

  private _onRemoteUserStateEvent: EventEmitter<UserState> = new EventEmitter();
  private _onRemoteUserJoinedEvent: EventEmitter<User> = new EventEmitter();
  private _onRemoteUserLeftEvent: EventEmitter<{ user: User; reason: string }> = new EventEmitter();
  private _onRemoteVolumeIndicatorEvent: EventEmitter<
    Array<{ level: number; uid: number | string }>
  > = new EventEmitter();
  private _onLocalUserJoinedEvent: EventEmitter<{ uid: string; track: IMediaTrack }> = new EventEmitter();
  private _onLocalUserLeftEvent: EventEmitter<any> = new EventEmitter();
  private _onLocalNetworkQualityChangeEvent: EventEmitter<NetworkQuality> = new EventEmitter();

  constructor(@Inject('config') private config: AgoraConfig) {
    this.client = AgoraRTC.createClient({
      codec: config.Video ? config.Video.codec : 'h264',
      mode: config.Video ? config.Video.mode : 'rtc',
      role: config.Video ? config.Video.role : 'audience'
    });

    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);

      this._onRemoteUserStateEvent.emit({
        mediaType,
        connectionState: 'CONNECTED',
        user: {
          uid: user.uid,
          hasVideo: user.hasVideo,
          hasAudio: user.hasAudio,
          audioTrack: {
            setVolume: volume => {
              if (user.audioTrack) {
                user.audioTrack.setVolume(volume);
                // tslint:disable-next-line:no-unused-expression
                user.audioTrack.getStats;
              }
            },
            getVolumeLevel: () => {
              if (user.audioTrack) {
                return user.audioTrack.getVolumeLevel() as number;
              }
            },
            play: () => {
              if (user.audioTrack) {
                user.audioTrack.play();
              }
            },
            getMediaStream: () => {
              if (user.audioTrack) {
                return new MediaStream([user.audioTrack.getMediaStreamTrack() as MediaStreamTrack]);
              }
            },
            getStats: () => {
              if (user.audioTrack) {
                return user.audioTrack.getStats();
              }
            },
            stop: () => {
              if (user.audioTrack) {
                user.audioTrack.stop();
              }
            }
          },
          videoTrack: {
            // tslint:disable-next-line:no-shadowed-variable
            play: (element, config) => {
              if (user.videoTrack) {
                user.videoTrack.play(element, config);
              }
            },
            getMediaStream: () => {
              if (user.videoTrack) {
                return new MediaStream([user.videoTrack.getMediaStreamTrack() as MediaStreamTrack]);
              }
            },
            getStats: () => {
              if (user.videoTrack) {
                return user.videoTrack.getStats();
              }
            },
            stop: () => {
              if (user.videoTrack) {
                user.videoTrack.stop();
              }
            }
          }
        }
      });
    });

    this.client.on('user-unpublished', user => {
      this._onRemoteUserStateEvent.emit({
        connectionState: 'DISCONNECTED',
        user: {
          uid: user.uid,
          hasVideo: user.hasVideo,
          hasAudio: user.hasAudio,
          audioTrack: {
            setVolume: volume => {
              if (user.audioTrack) {
                user.audioTrack.setVolume(volume);
              }
            },
            getVolumeLevel: () => {
              if (user.audioTrack) {
                return user.audioTrack.getVolumeLevel() as number;
              }
            },
            play: () => {
              if (user.audioTrack) {
                user.audioTrack.play();
              }
            },
            getMediaStream: () => {
              if (user.audioTrack) {
                return new MediaStream([user.audioTrack.getMediaStreamTrack() as MediaStreamTrack]);
              }
            },
            getStats: () => {
              if (user.audioTrack) {
                return user.audioTrack.getStats();
              }
            },
            stop: () => {
              if (user.audioTrack) {
                user.audioTrack.stop();
              }
            }
          },
          videoTrack: {
            // tslint:disable-next-line:no-shadowed-variable
            play: (element, config) => {
              if (user.videoTrack) {
                user.videoTrack.play(element, config);
              }
            },
            getMediaStream: () => {
              if (user.videoTrack) {
                return new MediaStream([user.videoTrack.getMediaStreamTrack() as MediaStreamTrack]);
              }
            },
            getStats: () => {
              if (user.videoTrack) {
                return user.videoTrack.getStats();
              }
            },
            stop: () => {
              if (user.videoTrack) {
                user.videoTrack.stop();
              }
            }
          }
        }
      });
    });

    this.client.on('user-joined', user => {
      this._onRemoteUserJoinedEvent.emit({
        uid: user.uid,
        hasVideo: user.hasVideo,
        hasAudio: user.hasAudio,
        audioTrack: {
          setVolume: volume => {
            if (user.audioTrack) {
              user.audioTrack.setVolume(volume);
            }
          },
          getVolumeLevel: () => {
            if (user.audioTrack) {
              return user.audioTrack.getVolumeLevel() as number;
            }
          },
          play: () => {
            if (user.audioTrack) {
              user.audioTrack.play();
            }
          },
          getMediaStream: () => {
            if (user.audioTrack) {
              return new MediaStream([user.audioTrack.getMediaStreamTrack() as MediaStreamTrack]);
            }
          },
          getStats: () => {
            if (user.audioTrack) {
              return user.audioTrack.getStats();
            }
          },
          stop: () => {
            {
              if (user.audioTrack) {
                user.audioTrack.stop();
              }
            }
          }
        },
        videoTrack: {
          // tslint:disable-next-line:no-shadowed-variable
          play: (element, config) => {
            if (user.videoTrack) {
              user.videoTrack.play(element, config);
            }
          },
          getMediaStream: () => {
            if (user.videoTrack) {
              return new MediaStream([user.videoTrack.getMediaStreamTrack() as MediaStreamTrack]);
            }
          },
          getStats: () => {
            if (user.videoTrack) {
              return user.videoTrack.getStats();
            }
          },
          stop: () => {
            if (user.videoTrack) {
              user.videoTrack.stop();
            }
          }
        }
      });
    });

    this.client.on('user-left', (user, reason) => {
      this._onRemoteUserLeftEvent.emit({
        user: {
          uid: user.uid,
          hasVideo: user.hasVideo,
          hasAudio: user.hasAudio,
          audioTrack: {
            setVolume: volume => {
              if (user.audioTrack) {
                user.audioTrack.setVolume(volume);
              }
            },
            getVolumeLevel: () => {
              if (user.audioTrack) {
                return user.audioTrack.getVolumeLevel() as number;
              }
            },
            play: () => {
              if (user.audioTrack) {
                user.audioTrack.play();
              }
            },
            getMediaStream: () => {
              if (user.audioTrack) {
                return new MediaStream([user.audioTrack.getMediaStreamTrack() as MediaStreamTrack]);
              }
            },
            getStats: () => {
              if (user.audioTrack) {
                return user.audioTrack.getStats();
              }
            },
            stop: () => {
              if (user.audioTrack) {
                user.audioTrack.stop();
              }
            }
          },
          videoTrack: {
            // tslint:disable-next-line:no-shadowed-variable
            play: (element, config) => {
              if (user.videoTrack) {
                user.videoTrack.play(element, config);
              }
            },
            getMediaStream: () => {
              if (user.videoTrack) {
                return new MediaStream([user.videoTrack.getMediaStreamTrack() as MediaStreamTrack]);
              }
            },
            getStats: () => {
              if (user.videoTrack) {
                return user.videoTrack.getStats();
              }
            },
            stop: () => {
              if (user.videoTrack) {
                user.videoTrack.stop();
              }
            }
          }
        },
        reason
      });
    });

    this.client.enableAudioVolumeIndicator();
    this.client.on('volume-indicator', result => {
      this._onRemoteVolumeIndicatorEvent.emit(result);
    });

    this.client.on('network-quality', stats => {
      this._onLocalNetworkQualityChangeEvent.emit({
        download: stats.downlinkNetworkQuality,
        upload: stats.uplinkNetworkQuality
      });
    });
  }

  public join(channelName: string, token: string, uid?: number): IJoinChannel<IMediaTrack> {
    const joinChannel = new JoinChannel(this.client, this.config, channelName, token, uid);
    joinChannel.registerUserJoinedEvent(this._onLocalUserJoinedEvent);
    return joinChannel;
  }

  public joinVideo(channelName: string, token: string, uid?: string): IVideoJoinChannel<IVideoTrack> {
    return new JoinVideoChannel(this.client, this.config, channelName, token, uid);
  }

  public joinAudio(channelName: string, token: string, uid?: string): IAudioJoinChannel<IAudioTrack> {
    return new JoinAudioChannel(this.client, this.config, channelName, token, uid);
  }

  public joinAudioFile(): IAudioFileJoinChannel<[IAudioFileTrack, IBufferSourceAudioTrack]> {
    return new JoinAudioFileChannel(this.client);
  }

  public async leave(): Promise<any> {
    await this.client.leave();
    await this.client.disableDualStream();
    this._onLocalUserLeftEvent.emit();
  }

  public async enableDualStream() {
    await this.client.enableDualStream();
  }

  public setLowStreamParameter(streamParameter: LowStreamParameter) {
    this.client.setLowStreamParameter(streamParameter);
  }

  public async setRemoteVideoStreamType(uid: UID, streamType: RemoteStreamType) {
    await this.client.setRemoteVideoStreamType(uid, streamType);
  }

  public getCameras(): Promise<MediaDeviceInfo[]> {
    return AgoraRTC.getCameras();
  }

  public getMicrophones(): Promise<MediaDeviceInfo[]> {
    return AgoraRTC.getMicrophones();
  }

  public getSounds(): Promise<MediaDeviceInfo[]> {
    return AgoraRTC.getPlaybackDevices();
  }

  public getDevices(): Promise<MediaDeviceInfo[]> {
    return AgoraRTC.getDevices();
  }

  public setLogLevel(level: number): void {
    AgoraRTC.setLogLevel(level);
  }

  public onRemoteUsersStatusChange(): Observable<UserState> {
    return this._onRemoteUserStateEvent.asObservable();
  }

  public onRemoteUserJoined(): Observable<User> {
    return this._onRemoteUserJoinedEvent.asObservable();
  }

  public onRemoteUserLeft(): Observable<{ user: User; reason: string }> {
    return this._onRemoteUserLeftEvent.asObservable();
  }

  public onRemoteVolumeIndicator(): Observable<Array<{ level: number; uid: number | string }>> {
    return this._onRemoteVolumeIndicatorEvent.asObservable();
  }

  public onLocalUserJoined(): Observable<{ uid: string; track: IMediaTrack }> {
    return this._onLocalUserJoinedEvent.asObservable();
  }

  public onLocalUserLeft(): Observable<{ user: User; reason: string }> {
    return this._onLocalUserLeftEvent.asObservable();
  }

  public onLocalNetworkQualityChange(): Observable<any> {
    return this._onLocalNetworkQualityChangeEvent.asObservable();
  }

  public getClient(): IAgoraRTCClient {
    return this.client;
  }
}
