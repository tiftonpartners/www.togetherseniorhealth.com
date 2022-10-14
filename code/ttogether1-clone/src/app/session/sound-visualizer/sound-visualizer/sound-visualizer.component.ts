import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SoundMeter } from '@app/shared/services/agora/utils/sound-meter';
import { MediaService } from '@app/shared/services/media/media.service';

@Component({
  selector: 'app-sound-visualizer',
  templateUrl: './sound-visualizer.component.html',
  styleUrls: ['./sound-visualizer.component.scss']
})
export class SoundVisualizerComponent implements OnInit, OnDestroy {
  private soundMeter!: SoundMeter;

  @Input() set mediaStream(value: MediaStream) {
    if (value) {
      this.connect(value);
    }
  }

  constructor(private mediaService: MediaService) {}

  ngOnInit() {}

  async connect(stream: MediaStream): Promise<void> {
    this.soundMeter = new SoundMeter(new AudioContext());
    this.soundMeter.connect(
      stream,
      instant => {},
      error => {
        if (error) {
          console.error('sound meter error: ', error.message, error.name);
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.soundMeter) {
      this.soundMeter.context.close();
    }
  }
}
