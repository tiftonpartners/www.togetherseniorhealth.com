import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { IRemoteAudioTrack, IRemoteVideoTrack } from '../services/agora/agora.types';
import { IMediaTrack } from '../services/agora/core';

export interface IAgoraVideoPlayerTrackOption {
  mediaTrack?: IMediaTrack;
  audioTrack?: IRemoteAudioTrack;
  videoTrack?: IRemoteVideoTrack;
  isHidden: boolean;
}

@Directive({
  selector: '[appAgoraVideoPlayer]'
})
export class AgoraVideoPlayerDirective implements OnInit {
  @Input('appAgoraVideoPlayer') set trackOption(options: IAgoraVideoPlayerTrackOption) {
    this.playTrack(options);
  }

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {}

  private playTrack(tracks: IAgoraVideoPlayerTrackOption): void {
    while (this.elementRef.nativeElement.firstChild) {
      this.elementRef.nativeElement.removeChild(this.elementRef.nativeElement.firstChild);
    }

    if (tracks && tracks.mediaTrack) {
      tracks.mediaTrack.playVideo(this.elementRef.nativeElement, { fit: 'contain' });
      return;
    }

    if (tracks && tracks.audioTrack) {
      tracks.audioTrack.play();
    }

    if (tracks && tracks.videoTrack) {
      tracks.videoTrack.play(this.elementRef.nativeElement, { fit: 'contain' });
    }
  }
}
