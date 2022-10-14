import AgoraRTC, { BufferSourceAudioTrackInitConfig, IAgoraRTCClient, IBufferSourceAudioTrack } from 'agora-rtc-sdk-ng';
import { IAudioFileTrack } from '../core/audio-file-track';
import { IAudioFileJoinChannel } from '../core/join-channel';
import { AudioFileTrack } from './audio-file-track';

export class JoinAudioFileChannel implements IAudioFileJoinChannel<[IAudioFileTrack, IBufferSourceAudioTrack]> {
  constructor(public client: IAgoraRTCClient) {}

  public async create(config: BufferSourceAudioTrackInitConfig): Promise<[IAudioFileTrack, IBufferSourceAudioTrack]> {
    const localFileTrack = await AgoraRTC.createBufferSourceAudioTrack(config);
    const audioFileTrack = new AudioFileTrack(localFileTrack);

    return new Promise<[IAudioFileTrack, IBufferSourceAudioTrack]>((resolve, reject) => {
      resolve([audioFileTrack, localFileTrack]);
      reject();
    });
  }
}
