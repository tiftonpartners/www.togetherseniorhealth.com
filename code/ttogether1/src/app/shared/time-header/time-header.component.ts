import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Logger, I18nService, untilDestroyed } from '@app/core';
import * as moment from 'moment-timezone';

const log = new Logger('TimeHeaderComponent');

@Component({
  selector: 'app-time-header',
  templateUrl: './time-header.component.html',
  styleUrls: ['./time-header.component.scss']
})
export class TimeHeaderComponent implements OnInit, OnDestroy {
  @Input() forcedTime: string;

  timeIsForced = false;
  date = '';
  time = '';

  private _now: moment.Moment;
  private _interval: NodeJS.Timeout;
  private _forcedTime: moment.Moment;

  constructor() {}

  ngOnInit() {
    if (this.forcedTime && this.forcedTime.length > 0) {
      this._forcedTime = moment(this.forcedTime, moment.ISO_8601);
      this.timeIsForced = this.forcedTime && this._forcedTime.isValid();
    }
    log.debug('(ngOnInit) forcedTime:', this.timeIsForced);

    this._updateTime();
    // Calculate time to next event minute (msec) and set a timer
    // so we start updating at even minutes
    // Note that we calculate the start of the next minute, then add
    // 100 msec margin of extra delay
    if (!this.timeIsForced) {
      const delay =
        moment()
          .add(1, 'minute')
          .startOf('minute')
          .add(100, 'ms')
          .valueOf() - moment().valueOf();
      this._interval = setTimeout(this._updateFirstTime, delay);
    }
  }

  ngOnDestroy() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  private _updateFirstTime = () => {
    this._updateTime();
    clearInterval(this._interval);
    this._interval = setInterval(this._updateTime, 60000);
  };

  private _updateTime = () => {
    this._now = this._forcedTime || moment();
    this.date = this._now.format('dddd, MMMM Do YYYY');
    this.time = this._now.format('h:mm a');
  };
}
