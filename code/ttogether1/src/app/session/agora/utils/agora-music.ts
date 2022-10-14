import { AgoraService } from '@app/shared/services/agora/agora.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IAgoraRTCClient, IBufferSourceAudioTrack } from 'agora-rtc-sdk-ng';
import { ClassMusicFile } from '../../sessions/music-api-service';
import { IAudioFileTrack } from '@app/shared/services/agora/core/audio-file-track';
import { Logger } from '@app/core';

const log = new Logger('AgoraAbstractComponent');

export enum MusicState {
  PAUSED = 'pause',
  STOPPED = 'stop',
  PLAYING = 'play'
}

export default class AgoraMusic {
  constructor(
    private agora: {
      musicState: MusicState;
      toggleMusicGuard: boolean;
      selectedMusic: ClassMusicFile | undefined;
      snackBarRef: any;
      audioFileTrack: IAudioFileTrack;
      localFileTrack: IBufferSourceAudioTrack;
      musicVolume: number;
      isMusicPlaying: boolean;
    }
  ) {}

  async play(snackBar: MatSnackBar, agoraService: AgoraService) {
    switch (this.agora.musicState) {
      case MusicState.PLAYING:
        // G2G
        this.agora.toggleMusicGuard = false;
        break;
      case MusicState.PAUSED:
        // Resume audio mixing
        try {
          this.handleAudioFileTrack(MusicState.PLAYING, 'Resumed');
        } catch (err) {
          log.error('(music) ERROR Resuming Audio Mixing:', err);
        }
        break;
      case MusicState.STOPPED:
        // Create audio file on new file
        const options = {
          cacheOnlineFile: true,
          source: this.agora.selectedMusic.unsignedURI
        };

        // Starts audio mixing.
        this.agora.snackBarRef = snackBar.open('Loading music...', 'Ok');

        try {
          const [audioFileTrack, localFileTrack] = await agoraService.joinAudioFile().create(options);
          this.agora.audioFileTrack = audioFileTrack;
          this.agora.localFileTrack = localFileTrack;
          if (this.agora.audioFileTrack && this.agora.localFileTrack) {
            this.agora.audioFileTrack.setVolume(this.agora.musicVolume);

            const client: IAgoraRTCClient = agoraService.getClient();
            await client.publish(this.agora.audioFileTrack.bufferSourceAudioTrack());
            this.handleAudioFileTrack(MusicState.PLAYING, 'started');
          }
        } catch (err) {
          log.error('(music) ERROR starting audio mixing. ' + err);
        }

        if (this.agora.snackBarRef) {
          this.agora.snackBarRef.dismiss();
          this.agora.snackBarRef = undefined;
        }
    }
    return this.agora;
  }

  pause() {
    if (this.agora.musicState === MusicState.PLAYING) {
      try {
        this.handleAudioFileTrack(MusicState.PAUSED, 'Paused');
      } catch (err) {
        log.error('(music) ERROR Pausing Audio Mixing:', err);
      }
    } else {
      this.agora.toggleMusicGuard = false;
    }
    return this.agora;
  }

  stop() {
    if (this.agora.musicState === MusicState.STOPPED) {
      this.agora.toggleMusicGuard = false;
    } else {
      try {
        this.handleAudioFileTrack(MusicState.STOPPED, 'Stopped');
      } catch (err) {
        log.error('(music) ERROR Stopping Audio Mixing:', err);
      }
    }
    return this.agora;
  }

  private handleAudioFileTrack(state: MusicState, action: string) {
    if (this.agora.audioFileTrack) {
      if (state === MusicState.PLAYING && action.toLowerCase() === 'resumed') {
        this.agora.audioFileTrack.resume();
      } else if (state === MusicState.PLAYING && action.toLowerCase() === 'started') {
        this.agora.audioFileTrack.play({ loop: true });
      } else {
        this.agora.audioFileTrack.pause();
      }

      this.agora.musicState = state;
      this.agora.isMusicPlaying = state === MusicState.PLAYING;
      this.agora.toggleMusicGuard = false;

      log.debug(`(music) Audio Mixing ${action}`);
    }
  }
}
