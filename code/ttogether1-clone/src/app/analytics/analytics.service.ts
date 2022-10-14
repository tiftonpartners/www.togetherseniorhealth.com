// This needs to be a global object
// takes in the common values in the constructor (or something to retrieve them)
// and then has a few simple calls to execute the call to gtag

import { Injectable } from '@angular/core';
import { GA } from '@app/evnt/ga-events';
import { environment } from '@env/environment';

declare const gtag: (event: any, action: any, c: any) => void;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  static initialized: boolean = false;

  static getAnalyticsDimensions: Function = () => {};

  constructor() {}

  initialize() {
    if (AnalyticsService.initialized) {
      return;
    }

    AnalyticsService.initialized = true;

    /** Disable automatic page view hit to fix duplicate page view count  **/
    gtag('config', environment.googleAnalyticsId, {
      custom_map: {
        dimension1: 'class_id',
        dimension2: 'class_name',
        dimension3: 'instructor_id',
        dimension4: 'participant_id',
        dimension5: 'is_instructor',
        dimension6: 'session_remote_user_id',
        metrics1: 'percentage',
        metrics2: 'bps',
        metrics3: 'bytes',
        metrics5: 'msec',
        metrics6: 'rank'
      }
    });
  }

  setGetAnalyticsDimensions(getAnalyticsDimensions: Function) {
    AnalyticsService.getAnalyticsDimensions = getAnalyticsDimensions;
  }

  sendEvent(event: any, value: any, percentage: number, ...rest: any) {
    if (environment.enableGA) {
      gtag(GA.EVENT, event.action, {
        ...AnalyticsService.getAnalyticsDimensions(),
        event_category: event.category,
        event_label: event.label,
        value,
        percentage,
        ...rest
      });
    }
  }

  public send(event: any, value: number, percentage: number, ...rest: any) {
    const percent = Math.min(Math.max(percentage, 0), 100);
    this.sendEvent(event, value, percent, ...rest);
  }

  sendMili(event: any, value: number, max: number, ...rest: any) {
    const percentage = Math.min(Math.max(((max - value) / max) * 100, 0), 100);
    this.sendEvent(event, value, percentage, ...rest);
  }

  sendBytes(event: any, value: number, max: number, ...rest: any) {
    const percentage = Math.min(Math.max(((max - value) / max) * 100, 0), 100);
    this.sendEvent(event, value, percentage, ...rest);
  }
}
