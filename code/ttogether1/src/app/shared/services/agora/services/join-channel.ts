import { EventEmitter } from '@angular/core';

import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  MicrophoneAudioTrackInitConfig
} from 'agora-rtc-sdk-ng';

import { AgoraConfig } from '../agora.config';
import { IJoinChannel, IJoinChannelApply, IMediaTrack } from '../core/interfaces';
import { MediaTrack } from './media-track';

export class JoinChannel implements IJoinChannel<IMediaTrack> {
  private requestInWait!: Promise<[IMicrophoneAudioTrack, ICameraVideoTrack]>;
  private tracks: Array<any> = new Array<any>();
  private audioConfig: MicrophoneAudioTrackInitConfig = {
    AEC: true, // acoustic echo cancellation
    AGC: true, // audio gain control
    ANS: true, // automatic noise suppression
    DTX: true, // discontinuous transmission
    encoderConfig: {
      sampleRate: 48000,
      stereo: false,
      bitrate: 16
    }
  };

  private _onLocalUserJoinedEvent: EventEmitter<{ uid: string; track: IMediaTrack }> = new EventEmitter();

  constructor(
    public client: IAgoraRTCClient,
    public config: AgoraConfig,
    public channelName: string,
    public token: string,
    public uid?: number
  ) {}

  public async apply(): Promise<IMediaTrack> {
    const uid = await this.client.join(this.config.AppID, this.channelName, this.token, this.uid);

    let localTrack: any;

    if (this.requestInWait) {
      localTrack = await this.requestInWait;
    } else if (this.tracks.length > 0) {
      localTrack = this.tracks;
    } else {
      localTrack = await AgoraRTC.createMicrophoneAndCameraTracks(this.audioConfig);
    }

    // ==========================================================================
    await this.client.publish(localTrack);

    const mediaTrack = new MediaTrack(localTrack);

    this._onLocalUserJoinedEvent.emit({ uid: uid.toString(), track: mediaTrack });

    return new Promise<IMediaTrack>((resolve, reject) => {
      resolve(mediaTrack);
      reject();
    });
  }

  public withMediaStream(
    videoMediaStream: MediaStreamTrack,
    audioMediaStream: MediaStreamTrack
  ): IJoinChannelApply<IMediaTrack> {
    this.tracks.push(AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: audioMediaStream }));
    this.tracks.push(AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoMediaStream }));
    return this;
  }

  public withCameraAndMicrophone(microphoneId: string, cameraId: string): IJoinChannelApply<IMediaTrack> {
    this.requestInWait = AgoraRTC.createMicrophoneAndCameraTracks(
      {
        ...this.audioConfig,
        microphoneId
      },
      {
        cameraId
      }
    );

    return this;
  }

  public registerUserJoinedEvent(event: EventEmitter<{ uid: string; track: IMediaTrack }>) {
    this._onLocalUserJoinedEvent = event;
  }
}
