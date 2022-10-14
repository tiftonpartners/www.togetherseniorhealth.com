import AgoraRTC, { BufferSourceAudioTrackInitConfig, IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { IAudioFileTrack } from '../core/audio-file-track';
import { IAudioFileJoinChannel } from '../core/join-channel';
import { AudioFileTrack } from './audio-file-track';

export class JoinAudioFileChannel implements IAudioFileJoinChannel<IAudioFileTrack> {
  constructor(public client: IAgoraRTCClient) {}

  public async create(config: BufferSourceAudioTrackInitConfig): Promise<IAudioFileTrack> {
    let localFileTrack = await AgoraRTC.createBufferSourceAudioTrack(config);
    let audioFileTrack = new AudioFileTrack(localFileTrack);

    return new Promise<IAudioFileTrack>((resolve, reject) => {
      resolve(audioFileTrack);
      reject();
    });
  }
}
