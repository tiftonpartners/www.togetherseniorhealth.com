// This needs to be a global object
// takes in the common values in the constructor (or something to retrieve them)
// and then has a few simple calls to execute the call to gtag

import { Injectable } from '@angular/core';
import { GA, GAEvent } from '@app/evnt/ga-events';
import { environment } from '@env/environment';

declare const gtag: (event: any, action: any, c: any) => void;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  static initialized = false;

  static getAnalyticsDimensions: () => any = () => {};

  constructor() {}

  initialize() {
    if (AnalyticsService.initialized) {
      return;
    }

    AnalyticsService.initialized = true;

    // Disable automatic page view hit to fix duplicate page view count
    gtag('config', environment.googleAnalyticsId, {
      custom_map: {
        dimension1: 'class_id',
        dimension2: 'class_name',
        dimension7: 'class_acronym',
        dimension3: 'instructor_id',
        dimension4: 'participant_id',
        dimension5: 'is_instructor',
        dimension6: 'session_remote_user_id',
        dimension8: 'user_name',
        dimension9: 'ts',
        metrics1: 'percentage',
        metrics2: 'bps',
        metrics3: 'bytes',
        metrics5: 'msec',
        metrics6: 'rank'
      }
    });
  }

  setGetAnalyticsDimensions(getAnalyticsDimensions: () => any) {
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

/**
 * Decorator function to inject a call to the GA send method
 * @param event The GAEvent to use in send method
 * @param params Array with value and percentage to use in send method
 * @param conditionalPath Conditional property to verify if params are conditional
 * @param condition The condition to test the property in conditionalPath
 * @param paramsCondition Array with value and percentage to use in send method if the condition is false
 */
export function sendGA(
  event: string = '',
  params: number[] = [],
  conditionalPath?: string,
  condition?: any,
  paramsCondition?: number[]
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const analyticsService = new AnalyticsService();
    const oldFunc = descriptor.value;
    const [value, percentage] = params;
    descriptor.value = async function(...args: any[]) {
      if (propertyKey === 'callbackRemoteUserChangeSubs') {
        const connectionState = args[0].connectionState;
        if (['DISCONNECTED', 'DISCONNECTING', 'RECONNECTING'].includes(connectionState)) {
          const connectionStats = connectionState === 'RECONNECTING' ? [1, 100] : [0, 0];
          this.analyticsService.send(
            connectionState === 'DISCONNECTED' ? GAEvent.connected : GAEvent.reconnecting,
            connectionStats[0],
            connectionStats[1]
          );
        }
      } else if (propertyKey === 'callbackLocalNetworkQualitySubs') {
        analyticsService.send(
          GAEvent.downlinkNetworkQuality,
          this.downlinkNetworkQuality,
          ((7 - ((this.downlinkNetworkQuality + 6) % 7)) / 7) * 100
        );
        analyticsService.send(
          GAEvent.uplinkNetworkQuality,
          this.uplinkNetworkQuality,
          ((7 - ((this.uplinkNetworkQuality + 6) % 7)) / 7) * 100
        );

        const rtcStats = this._agoraService.getClient().getRTCStats();
        if (rtcStats) {
          analyticsService.sendMili(GAEvent.duration, rtcStats.Duration, 10);
          analyticsService.sendMili(GAEvent.outgoingAvailableBandwidth, rtcStats.OutgoingAvailableBandwidth, 50000);
          analyticsService.sendMili(GAEvent.rtt, rtcStats.RTT, 10000);
          analyticsService.sendMili(GAEvent.recvBitrate, rtcStats.RecvBitrate, 60000);
          analyticsService.sendMili(GAEvent.recvBytes, rtcStats.RecvBytes, 10000);
          analyticsService.sendMili(GAEvent.sendBitrate, rtcStats.SendBitrate, 60000);
          analyticsService.sendMili(GAEvent.sendBytes, rtcStats.SendBytes, 10000);
          analyticsService.sendMili(GAEvent.userCount, rtcStats.UserCount, 17);
        }
      } else if (propertyKey === 'meetingUserInfoGA') {
        const meetingUserInfo = args[0];
        const session = {
          session_remote_user_id: meetingUserInfo.meetingUser.user.uid,
          user_name: meetingUserInfo.userInfo.name,
          participant_id: meetingUserInfo.userInfo.id
        };

        const audioStats = meetingUserInfo.meetingUser.user.audioTrack.getStats();
        if (audioStats) {
          analyticsService.sendMili(GAEvent.audioRoundTripLatency, audioStats.end2EndDelay, 10000, session);
          analyticsService.sendMili(GAEvent.audioReceiveLatency, audioStats.receiveDelay, 10000, session);
          analyticsService.sendMili(GAEvent.audioSendLatency, audioStats.transportDelay, 10000, session);
        }

        const videoStats = meetingUserInfo.meetingUser.user.videoTrack.getStats();
        if (videoStats) {
          [
            [GAEvent.videoRoundTripLatency, videoStats.end2EndDelay, 10000, session],
            [GAEvent.videoReceiveLatency, videoStats.receiveDelay, 10000, session],
            [GAEvent.videoSendLatency, videoStats.transportDelay, 10000, session]
          ].forEach(evts => {
            const [name, action, category, label]: any = evts;
            return analyticsService.sendMili(name, action, category, label, session);
          });
        }
      } else {
        if (!conditionalPath) {
          analyticsService.send(GAEvent[event], value, percentage);
        } else {
          const conditionProp = conditionalPath.split('.').reduce((obj, prop) => obj[prop], this);
          if ((condition && conditionProp === condition) || (!condition && conditionProp)) {
            analyticsService.send(GAEvent[event], value, percentage);
          } else {
            const [valueCondition, percentageCondition] = paramsCondition;
            analyticsService.send(GAEvent[event], valueCondition, percentageCondition);
          }
        }
      }
      await oldFunc.apply(this, args);
    };
  };
}
