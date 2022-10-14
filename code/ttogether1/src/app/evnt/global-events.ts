export enum EventClass {
  Notify = 'N',
  Command = 'C',
  None = 'X',
  UNKNOWN = '?'
}

export enum EventType {
  AudioMuted = 'AM',
  AudioUnmuted = 'AU',
  CameraOff = 'CameraOff',
  CameraOn = 'CameraOn',
  ChangeView = 'CV',
  ChangeViewAll = 'CVA',
  Debug = 'DBG',
  LeaveSession = 'LS',
  LoggedIn = 'LI',
  LoggedOut = 'LO',
  Logout = 'LO',
  LogoutAll = 'LOA',
  MediaStatus = 'MS',
  MediaStatusAll = 'MSA',
  MicOff = 'MicOff',
  MicOn = 'MicOn',
  MuteAudio = 'MA',
  MuteMicAll = 'MMA',
  MuteVideoAll = 'MVA',
  Navigate = 'N',
  NavigateAll = 'NL',
  Navigated = 'NN',
  None = 'X',
  Record = 'RE',
  Music = 'MC',
  MusicVolume = 'PV',
  SessionJoined = 'SJ',
  SessionLeft = 'SL',
  Unknown = '?',
  UnmuteAudio = 'UA',
  UnmuteMicAll = 'UMA',
  UnmuteVideoAll = 'UVA',
  ViewChanged = 'VC',
  HelpWanted = 'HW',
  ClearHelp = 'CH',
  ShowStats = 'SS',
  QosAlert = 'QOS',
  SetHelpMessage = 'SH',
  StartOver = 'SO',
  VideoOptimizationMode = 'VOM',
  // These two events are sent when a video is both muted/unmuted. See TOG-863
  SessionInactive = 'IS', // Inactive Session
  SessionActive = 'AS', // Active Session
  // {
  //   "eventClass": "N",
  //   "event": "IS",
  //   "subject": "auth0|5fc5553ca7674a006e94c83f",
  //   "sessionId": "MTROBOT-BOTS1-211216",
  //   "target": ""
  // }
  // {
  //   "eventClass": "N",
  //   "event": "AS",
  //   "subject": "auth0|6049601481454200709b4817",
  //   "sessionId": "MTROBOT-BOTS1-211216",
  //   "target": "{'isEnabledVideo':false, 'isEnabledAudio': true)}"
  // }
  LeaveInstructor = 'LIT'
}

export const enum ERecordEvent {
  OFF = 'off',
  ON = 'on',
  PAUSE = 'pause'
}

/**
 * Values for the target of Music events
 * These can be for notifications or commands
 */
export const enum EMusicEvent {
  PLAY = 'play',
  PAUSE = 'pause',
  STOP = 'stop',
  VOLUME_UP = 'vup',
  VOLUME_DOWNN = 'vdown',
  LOADING = 'loading',
  READY = 'ready'
}

export function getKeyFromObject(eventType: EventType | EventClass, data: any): string {
  const eventName = Object.keys(data).find(key => data[key] === eventType);
  return eventName || '';
}

// ****
// * Arrays and utilities to classify Event Types
// *

export const MediaEvents = [
  EventType.MuteMicAll,
  EventType.MuteAudio, // Mute audio output FROM REMOTE stream
  EventType.MuteVideoAll,
  EventType.UnmuteMicAll,
  EventType.UnmuteVideoAll,
  EventType.UnmuteAudio, // Unmute audio output FROM REMOTE stream
  EventType.AudioMuted,
  EventType.AudioUnmuted,
  EventType.CameraOff,
  EventType.CameraOn,
  EventType.MicOff, // mic off
  EventType.MicOn, // mic on
  EventType.MediaStatus,
  EventType.MediaStatusAll,
  EventType.QosAlert,
  EventType.SessionActive,
  EventType.SessionInactive,
  EventType.SessionJoined,
  EventType.SessionLeft
];

export const ActiveSessionEvents = [
  EventType.SessionActive,
  EventType.SessionInactive,
  EventType.SessionLeft,
  EventType.SessionJoined
];

export function IsMediaEvent(e: EventType) {
  return MediaEvents.includes(e);
}

export function IsActiveSessionEvent(e: EventType) {
  return ActiveSessionEvents.includes(e);
}

export const MuteEvents = [
  EventType.MuteMicAll,
  EventType.MuteAudio,
  EventType.MuteVideoAll,
  EventType.AudioMuted,
  EventType.MicOff,
  EventType.CameraOff
];

export function IsMuteEvent(e: EventType) {
  return MuteEvents.includes(e);
}

export const UnmuteEvents = [
  EventType.UnmuteMicAll,
  EventType.UnmuteVideoAll,
  EventType.UnmuteAudio,
  EventType.AudioUnmuted,
  EventType.MicOn,
  EventType.CameraOn
];

export function IsUmuteEvent(e: EventType) {
  return UnmuteEvents.includes(e);
}

export const MicEvents = [EventType.MuteMicAll, EventType.UnmuteMicAll, EventType.MicOff, EventType.MicOn];

export function IsMicEvent(e: EventType) {
  return MicEvents.includes(e);
}

export const RecordingEvents = [EventType.Record];

export function IsRecordingEvent(e: EventType) {
  return RecordingEvents.includes(e);
}

export const MusicEvents = [EventType.Music];

export function IsMusicEvent(e: EventType) {
  return MusicEvents.includes(e);
}

export const VideoEvents = [EventType.MuteVideoAll, EventType.UnmuteVideoAll, EventType.CameraOff, EventType.CameraOn];

export function IsVideoEvent(e: EventType) {
  return VideoEvents.includes(e);
}

export const HelpEvents = [EventType.HelpWanted];

export function IsHelpEvent(e: EventType) {
  return HelpEvents.includes(e);
}

export const AllParticipantEvents = [
  EventType.NavigateAll,
  EventType.LogoutAll,
  EventType.MuteMicAll,
  EventType.MuteVideoAll,
  EventType.UnmuteMicAll,
  EventType.UnmuteVideoAll,
  // EventType.ChangeViewAll,
  EventType.MediaStatusAll
];

export function IsForAllParticipants(e: EventType) {
  return AllParticipantEvents.includes(e);
}

export const ViewEvents = [EventType.ViewChanged, EventType.ChangeView, EventType.ChangeViewAll];

export function IsViewEvent(e: EventType) {
  return ViewEvents.includes(e);
}

export const QosEvents = [EventType.QosAlert];
export function IsQosEvent(e: EventType) {
  return QosEvents.includes(e);
}

export const NO_SUBJECT = '-';
export const NO_SESSION = NO_SUBJECT;
export const NO_TARGET = '';
export const NO_STREAM = NO_SUBJECT;
export const ANY_SUBJECT = '*';
export const ANY_SESSION = ANY_SUBJECT;
export const ANY_TARGET = ANY_SUBJECT;
export const SERVER = '$';

export class GlobalEvent {
  eventClass: EventClass = EventClass.None;
  event: EventType = EventType.None;
  subject = NO_SUBJECT; // Who this is for/about, '*' indicates everybody in the session, '-' indicates nobody
  sessionId = NO_SESSION; // Session Id, '*' indicates all sessions, '-' indicates no session
  target: any = NO_TARGET; // Command specific data, usually a string except for login

  // Construct a new GlobalEvent from a generic object with compatible properties
  // Useful
  static ConvertFromAny(obj: any): GlobalEvent {
    obj.__proto__ = GlobalEvent.prototype;
    return obj;
  }

  constructor(eventClass: EventClass, event: EventType) {
    this.event = event;
    this.eventClass = eventClass;
  }

  toFriendly() {
    return {
      eventClass: getKeyFromObject(this.eventClass, EventClass),
      event: getKeyFromObject(this.event, EventType),
      subject: this.subject,
      sessionId: this.sessionId,
      target: this.target
    };
  }
}
