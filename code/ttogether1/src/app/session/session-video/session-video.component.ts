import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener,
  OnDestroy,
  OnChanges,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { environment } from '@env/environment';
import { UserInfo } from '@app/core/authentication/user.types';
import { MeetingUser, MeetingUserType, VideoLocation } from '../agora/utils/meeting-user-info';
import { Logger } from '@app/core';
import { GlobalEventService } from '@app/evnt/global-events.service';
import { EventType, GlobalEvent } from '@app/evnt/global-events';
import { IAgoraVideoPlayerTrackOption } from '@app/shared/directives/agora-video-player.directive';
import { OptimizationMode } from '@app/shared/services/agora/agora.consts';
import { RemoteStreamType } from 'agora-rtc-sdk-ng';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// These variables control active speaker detection.
// The sampling interval, and the number of samples
// required to switch to silence and speaking
// const GET_VOLUME_INTERVAL_TIME = 200;
// const GET_VOLUME_SILENCE_COUNT = 9;
// const GET_VOLUME_SPEAKING_COUNT = 3;

// How often we sample resolution
const GET_RESOLUTION_SAMPLE_MSECS = 1000 * environment.statsDisplay.sampleTimeSecs;
const log = new Logger('SessionVideoComponent');

@Component({
  selector: 'app-session-video',
  templateUrl: './session-video.component.html',
  styleUrls: ['./session-video.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SessionVideoComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() set meetingUser(value: MeetingUser) {
    if (value) {
      this._meetingUser = value;
      if (value.type === MeetingUserType.REMOTE) {
        if (value.user) {
          this.trackoptions = {
            videoTrack: value.user.videoTrack,
            audioTrack: value.user.audioTrack,
            isHidden: value.isHidden
          };

          this.micStatus = !!value.user.hasAudio;
          if (value.user.audioTrack) {
            this.audioStream = value.user.audioTrack.getMediaStream();
          }
        }
      } else {
        this.trackoptions = {
          mediaTrack: value.mediaTrack,
          isHidden: value.isHidden
        };
      }
    }
  }
  // isInstructor = false;
  // volumeSilenceCount = 0; // These are actually countdown timers
  // volumeSpeakingCount = 0;
  nickname = '';
  name = '';
  controlsVisable = false; // Current state of controls
  doingCurrentSpeaker = false; // Are we doing the current speaker indicator for this video?
  pollAudioInterval: NodeJS.Timeout;

  sampleVideoStats = false;
  statsStr = '';
  packetLossCount = 0; // Packet Loss count at last sample
  qos = false; // Is there a QoS problem?
  qosFilterCount = environment.statsDisplay.qosFilter;

  _meetingUser: MeetingUser;
  trackoptions?: IAgoraVideoPlayerTrackOption;
  audioStream?: MediaStream;
  micStatus = false;

  @ViewChild('videoContainer', { static: true }) videoContainer: ElementRef;
  @ViewChild('videoItem', { static: true }) videoItem: ElementRef;
  @ViewChild('rdVideoOptimizationNone', { static: true }) rdVideoOptimizationNone: ElementRef;
  @ViewChild('rdVideoOptimizationDetail', { static: true }) rdVideoOptimizationDetail: ElementRef;
  @ViewChild('rdVideoOptimizationMotion', { static: true }) rdVideoOptimizationMotion: ElementRef;
  @Input() remoteStreamType: RemoteStreamType;
  @Input() videoContainerId: string;
  @Input() userInfo: UserInfo;
  @Input() spotlight = false;
  @Input() watchResize = false;
  @Input() showControls = false; // Should we ever show controls? Controls allow the instructor to mute, spotlight
  @Input() showIndicators = true; // Should we ever show indicators? Indicators are QoS, Spotlight & Help
  @Input() isJoined = false; // Should the remote user be joined now?
  @Input() isMicOn = false; // Is mic on?
  @Input() isCameraOn = false; // Is camera on?
  @Input() hidden = false; // Am I hidden?
  @Input() location: VideoLocation = null; // Location + size of the video, if any
  @Input() helpWanted = false;
  @Input() speaking = false;
  @Input() isTheInstructor = false; // Is the current user viewing this the instructor?
  @Input() sessionInactive = false; // Is the session inactive?
  @Input() videoOptimizationMode = OptimizationMode.NONE; //
  @Output() changeView = new EventEmitter();
  @Output() startOver = new EventEmitter();
  @Output() controlMicrophone = new EventEmitter();
  @Output() controlVideo = new EventEmitter();
  @Output() clearHelp = new EventEmitter();

  // Dismisses/destroys all subscribed subjects
  private destroy$: Subject<void> = new Subject();

  constructor(private _globalEventService: GlobalEventService) {
    this._globalEventService.newCommand$.pipe(takeUntil(this.destroy$)).subscribe(event => {
      try {
        this.handleGlobalEvents(event);
      } catch (e) {
        log.error(e);
      }
    });
  }

  ngOnInit() {
    if (this.isTheInstructor) {
      this.sampleVideoStats = true;
      this.setPolling();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.onResize();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    /* Note that the properties of the object are set to the current value when this is called.
     */

    for (const propName in changes) {
      if (changes.hasOwnProperty(propName)) {
        const chng = changes[propName];

        if (propName === 'userInfo' && chng.currentValue) {
          this.userInfo = chng.currentValue;
          this.nickname = this.userInfo.nickname;
          this.name = this.userInfo.name;
        }

        if (propName === 'isJoined') {
          this.setPolling();
        }

        if (propName === 'location' && !!chng.currentValue) {
          const location = chng.currentValue as VideoLocation;
          const videoItem = this.videoItem.nativeElement;
          const videoContainer = this.videoContainer.nativeElement;
          if (location && location.height > 0 && location.width > 0) {
            // Update absolute location
            if (videoContainer && videoItem) {
              videoItem.style.width = `${location.width}px`;
              videoItem.style.position = 'absolute';
              videoItem.style.left = `${location.left}px`;
              videoItem.style.top = `${location.top}px`;
              videoContainer.style.height = `${location.height}px`;
            }
          }
        }
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.pollAudioInterval);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: any) {
    if (!this.watchResize) {
      return;
    }

    const currentWidth = this.videoContainer.nativeElement.offsetWidth;
    const multiplier = currentWidth / 16;
    const height = Math.ceil(multiplier * 9);
    this.videoContainer.nativeElement.style.height = `${height}px`;
  }

  /**
   * Called to show/hide options buttons (currently on hover)
   *
   * @param visible Should we show the options?
   */
  toggleOptions(visible: boolean): void {
    this.controlsVisable = this.showControls && visible && this.isJoined;
  }

  onClickSpotlight() {
    this.changeView.emit(this.userInfo.id);
  }

  onClickMute() {
    this.controlMicrophone.emit(this.userInfo.id);
  }

  onClickVideo() {
    this.controlVideo.emit(this.userInfo.id);
    log.debug('(click) Video for ID:', this.userInfo.id);
  }

  onClickStartOver() {
    log.debug('(onClickStartOver)');
    this.startOver.emit(this.userInfo.id);
  }

  onClickHelpRequested() {
    /* @TODO Build the logic to send the event to the server */
    log.debug('(onClickHelpRequested)');
    this.clearHelp.emit(this.userInfo.id);
  }

  onClickQOS() {
    /* @TODO Build the logic necessary here.
      The logic to activate this
      See
      - https://docs.agora.io/en/Audio%20Broadcast/lastmile_quality_web?platform=Web
      - https://docs.agora.io/en/Audio%20Broadcast/in-call_quality_web?platform=Web
    */
    log.debug('(onClickQOS)');
    this.qos = false;
    this.qosFilterCount = environment.statsDisplay.qosFilter;
  }

  /**
   * Handle global events of interest
   * @param evt - Event handle.
   */
  handleGlobalEvents = async (evt: GlobalEvent) => {
    if (evt.event === EventType.ShowStats) {
      this.sampleVideoStats = evt.target === 'on';
      this.statsStr = this.sampleVideoStats && !!this._meetingUser ? '- - -' : '';
      this.setPolling();
    }
  };

  isRemote(): boolean {
    if (this._meetingUser) {
      return this._meetingUser.type === MeetingUserType.REMOTE;
    }

    return false;
  }

  /**
   * Clear the current speaker sampling interval
   */
  private clearCurrentSpeakerInterval(): void {
    if (this.pollAudioInterval) {
      clearInterval(this.pollAudioInterval);
      this.pollAudioInterval = undefined;
    }
  }

  /**
   * Set QoS indicator based on new QoS Sample
   * @param newQos - QoS indicator.
   */
  private setFilteredQos(newQos: boolean) {
    if (newQos !== this.qos) {
      this.qosFilterCount--;
      if (this.qosFilterCount <= 0) {
        this.qos = newQos;
      }
    }
    if (this.qos === newQos) {
      this.qosFilterCount = environment.statsDisplay.qosFilter;
    }
  }

  /**
   * Activate/deactivate current speaker polling.
   */
  private setPolling(): void {
    // Clear any existing interval.
    this.clearCurrentSpeakerInterval();
    let videoSampleTime = Date.now();
    this.statsStr = '';

    // Define the callback for each polling cycle
    const callback = () => {
      if (this.sampleVideoStats && Date.now() - videoSampleTime >= GET_RESOLUTION_SAMPLE_MSECS) {
        // Time to update the sampling of the video stats.
        const startTime = Date.now();
        const c = environment.statsDisplay;
        if (!this._meetingUser) {
          return;
        }

        if (this._meetingUser.type === MeetingUserType.LOCAL) {
          const trackStats = this._meetingUser.mediaTrack.getStats();
          if (trackStats.sendFrameRate) {
            const mode = this.remoteStreamType === RemoteStreamType.HIGH_STREAM ? 'H' : 'L';
            let str = `* ${mode} ${trackStats.sendResolutionWidth}x${trackStats.sendResolutionHeight}, `;
            str += `${trackStats.sendFrameRate}fs ${Math.round(trackStats.encodeDelay)}ms`;
            this.statsStr = str;
            const qos = trackStats.sendFrameRate < c.minFps || trackStats.encodeDelay * 2 > c.maxE2Etime;
            this.setFilteredQos(qos);
          } else {
            this.statsStr = '- - -';
          }
        } else {
          const trackStats = this._meetingUser.user.videoTrack.getStats();
          if (trackStats) {
            const mode = this.remoteStreamType === RemoteStreamType.HIGH_STREAM ? 'H' : 'L';
            // Receiving the stream
            let str = `${mode} ${trackStats.receiveResolutionWidth}x${trackStats.receiveResolutionHeight} `;
            // Record packets loss since last sample.
            // Note that audioReceivePacketsLost is cumulative for all time.
            let pktLoss = trackStats.receivePacketsLost - this.packetLossCount;
            pktLoss = pktLoss < 0 ? 0 : pktLoss;
            this.packetLossCount = trackStats.receivePacketsLost;
            str += `${trackStats.receiveFrameRate}fps ${Math.round(trackStats.receiveDelay)}ms ${pktLoss}pl`;
            this.statsStr = str;
            const qos =
              trackStats.receiveFrameRate < c.minFps ||
              trackStats.receiveDelay > c.maxReceiveDelay ||
              pktLoss > c.maxPacketLoss;
            this.setFilteredQos(qos);
          } else {
            this.statsStr = this.isJoined ? '- - -' : '';
          }
        }

        videoSampleTime = Date.now();
      }
    };

    // Setup polling (or not!)
    log.debug('(setPolling) sampleVideoStats:', this.sampleVideoStats, 'isTheInstructor:', this.isTheInstructor);

    if (this._meetingUser) {
      if (this.sampleVideoStats) {
        // We are only sampling video stats.  The polling interval is just
        // slightly longer than the sampling time, ensuring that we sample every
        // interval
        this.statsStr = this.isJoined ? '- - -' : '';
        this.pollAudioInterval = setInterval(callback, GET_RESOLUTION_SAMPLE_MSECS + 10);
      } else {
        // log.debug('(setPolling) Polling is DISABLED, stream:', this.stream.getId())
      }
    } else if (this._meetingUser) {
      // log.debug('(setPolling) Polling is STOPPED, stream:', this.stream.getId());
    }
  }
}
