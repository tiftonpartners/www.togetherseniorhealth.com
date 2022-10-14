import { BufferSourceAudioTrackInitConfig } from 'agora-rtc-sdk-ng';

export interface IJoinChannelApply<T> {
  apply(): Promise<T>;
}

export interface IJoinChannel<T> extends IJoinChannelApply<T> {
  withMediaStream(videoMediaStream: MediaStreamTrack, audioMediaStream: MediaStreamTrack): IJoinChannelApply<T>;
  withCameraAndMicrophone(microphoneId: string, cameraId: string): IJoinChannelApply<T>;
}

export interface IAudioJoinChannel<T> extends IJoinChannelApply<T> {
  withMediaStream(audioMediaStream: MediaStreamTrack): IJoinChannelApply<T>;
  withMicrophone(microphoneId: string): IJoinChannelApply<T>;
}

export interface IAudioFileJoinChannel<T> {
  create(config: BufferSourceAudioTrackInitConfig): Promise<T>;
}

export interface IVideoJoinChannel<T> extends IJoinChannelApply<T> {
  withMediaStream(videoMediaStream: MediaStreamTrack): IJoinChannelApply<T>;
  withCamera(cameraId: string): IJoinChannelApply<T>;
}
