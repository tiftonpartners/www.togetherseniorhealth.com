import 'package:flutter/material.dart';
import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

class EventClass {
  static const Notify = 'N';
  static const Command = 'C';
  static const None = 'X';
  static const UNKNOWN = '?';
}

class SocketStatus {
  static const Connected = 'Connected';
  static const Disconnected = 'Disconnected';
  static const Reconnecting = 'Reconnecting';
  static const Error = 'Error';
  static const TIME_OUT = 'Time out';
}

class EventType {
  static const AudioMuted = 'AM';
  static const AudioUnmuted = 'AU';
  static const CameraOff = 'CameraOff';
  static const CameraOn = 'CameraOn';
  static const ChangeView = 'CV';
  static const ChangeViewAll = 'CVA';
  static const Debug = 'DBG';
  static const LeaveSession = 'LS';
  static const LoggedIn = 'LI';
  static const LoggedOut = 'LO';
  static const Logout = 'LO';
  static const LogoutAll = 'LOA';
  static const MediaStatus = 'MS';
  static const MediaStatusAll = 'MSA';
  static const MicOff = 'MicOff';
  static const MicOn = 'MicOn';
  static const MuteAudio = 'MA';
  static const MuteMicAll = 'MMA';
  static const MuteVideoAll = 'MVA';
  static const Navigate = 'N';
  static const NavigateAll = 'NL';
  static const Navigated = 'NN';
  static const None = 'X';
  static const Record = 'RE';
  static const Music = 'MC';
  static const MusicVolume = 'PV';
  static const SessionJoined = 'SJ';
  static const SessionLeft = 'SL';
  static const Unknown = '?';
  static const UnmuteAudio = 'UA';
  static const UnmuteMicAll = 'UMA';
  static const UnmuteVideoAll = 'UVA';
  static const ViewChanged = 'VC';
  static const HelpWanted = 'HW';
  static const ClearHelp = 'CH';
  static const ShowStats = 'SS';
  static const QosAlert = 'QOS';
  static const SetHelpMessage = 'SH';
  static const StartOver = 'SO';
  static const Video = 'VIDEO';
  static const Inactive = 'IS';
  static const Active = 'AS';
}

class ERecordEvent {
  static const OFF = 'off';
  static const ON = 'on';
  static const PAUSE = 'pause';
}

class MusicState {
  static const PAUSED = 'pause';
  static const STOPPED = 'stop';
  static const PLAYING = 'play';
}

/// Values for the target of Music events
/// These can be for notifications or commands
class EMusicEvent {
  static const PLAY = 'play';
  static const PAUSE = 'pause';
  static const STOP = 'stop';
  static const VOLUME_UP = 'vup';
  static const VOLUME_DOWNN = 'vdown';
  static const LOADING = 'loading';
  static const READY = 'ready';
}

// ****
// * Arrays and utilities to classify Event Types
// *

const MediaEvents = [
  EventType.MuteMicAll,
  EventType.MuteAudio,
  EventType.MuteVideoAll,
  EventType.UnmuteMicAll,
  EventType.UnmuteVideoAll,
  EventType.UnmuteAudio,
  EventType.AudioMuted,
  EventType.AudioUnmuted,
  EventType.CameraOff,
  EventType.CameraOn,
  EventType.MicOff,
  EventType.MicOn,
  EventType.MediaStatus,
  EventType.MediaStatusAll,
  EventType.QosAlert
];

bool isMediaEvent(String eventType) {
  return MediaEvents.contains(eventType);
}

const MuteEvents = [
  EventType.MuteMicAll,
  EventType.MuteAudio,
  EventType.MuteVideoAll,
  EventType.AudioMuted,
  EventType.MicOff,
  EventType.CameraOff
];

bool isMuteEvent(String eventType) {
  return MuteEvents.contains(eventType);
}

const UnmuteEvents = [
  EventType.UnmuteMicAll,
  EventType.UnmuteVideoAll,
  EventType.UnmuteAudio,
  EventType.AudioUnmuted,
  EventType.MicOn,
  EventType.CameraOn
];

bool isUmuteEvent(String eventType) {
  return UnmuteEvents.contains(eventType);
}

const MicEvents = [
  EventType.MuteMicAll,
  EventType.UnmuteMicAll,
  EventType.MicOff,
  EventType.MicOn
];

bool isMicEvent(String eventType) {
  return MicEvents.contains(eventType);
}

const RecordingEvents = [EventType.Record];

bool isRecordingEvent(String eventType) {
  return RecordingEvents.contains(eventType);
}

const MusicEvents = [EventType.Music];

bool isMusicEvent(String e) {
  return MusicEvents.contains(e);
}

const VideoEvents = [
  EventType.MuteVideoAll,
  EventType.UnmuteVideoAll,
  EventType.CameraOff,
  EventType.CameraOn
];

bool isVideoEvent(String eventType) {
  return VideoEvents.contains(eventType);
}

const HelpEvents = [EventType.HelpWanted];

bool isHelpEvent(String eventType) {
  return HelpEvents.contains(eventType);
}

const AllParticipantEvents = [
  EventType.NavigateAll,
  EventType.LogoutAll,
  EventType.MuteMicAll,
  EventType.MuteVideoAll,
  EventType.UnmuteMicAll,
  EventType.UnmuteVideoAll,
  // EventType.ChangeViewAll,
  EventType.MediaStatusAll
];

bool isForAllParticipants(String eventType) {
  return AllParticipantEvents.contains(eventType);
}

const ViewEvents = [
  EventType.ViewChanged,
  EventType.ChangeView,
  EventType.ChangeViewAll
];

bool isViewEvent(String e) {
  return ViewEvents.contains(e);
}

const QosEvents = [EventType.QosAlert];
bool isQosEvent(String eventType) {
  return QosEvents.contains(eventType);
}

// End of signal events
//
// export const NO_SUBJECT = '-';
const String NO_SUBJECT = '-';
const String NO_SESSION = NO_SUBJECT;
const String NO_TARGET = '';
const String NO_STREAM = NO_SUBJECT;
const String ANY_SUBJECT = '*';
const String ANY_SESSION = ANY_SUBJECT;
const String ANY_TARGET = ANY_SUBJECT;
const String SERVER = '\$';

class EClientView {
  static const FOCUS = 'instructor';
  static const INSTRUCTOR = 'inst';
  static const GROUP = 'group';
  static const SPOTLIGHT = 'spot';
  static const NONE = '-';
  static const STREAM = 's';
  static const UNKNOWN = '?';
}

class GlobalEvent {
  String eventClass;
  String event;
  String
      subject; // Who this is for/about, '*' indicates everybody in the session, '-' indicates nobody
  String
      sessionId; // Session Id, '*' indicates all sessions, '-' indicates no session
  dynamic target; // Command specific data, usually a string except for login

  // Construct a new GlobalEvent from a generic object with compatible properties
  // Useful
  // static ConvertFromAny(obj: any): GlobalEvent {
  // obj.__proto__ = GlobalEvent.prototype;
  // return obj;
  // }

  GlobalEvent({
    this.eventClass = EventClass.None,
    this.event = EventType.None,
    this.subject = NO_SUBJECT,
    this.sessionId = NO_SESSION,
    this.target = NO_TARGET,
  });

  factory GlobalEvent.fromJson(Map<String, dynamic> json) {
    return GlobalEvent(
      eventClass: json['eventClass'],
      event: json['event'],
      sessionId: json['sessionId'],
      subject: json["subject"],
      target: json["target"],
    );
  }

  Map<String, dynamic> toFriendly() => {
        "eventClass": this.eventClass,
        "event": this.event,
        "subject": this.subject,
        "sessionId": this.sessionId,
        "target": this.target
      };

  @override
  bool operator ==(other) {
    return (other is GlobalEvent) &&
        other.eventClass == eventClass &&
        other.event == event &&
        other.subject == subject &&
        other.sessionId == sessionId &&
        other.target == target;
  }
}

class ClassMusicFile {
  String fileName;
  String title;
  String ext;
  int size = 0;
  String expireTime; // Expiration time for the signedURI, ISO 8601
  String signedURI;
  String unsignedURI;

  ClassMusicFile({
    this.fileName,
    this.title,
    this.ext,
    this.size,
    this.expireTime,
    this.signedURI,
    this.unsignedURI,
  });

  factory ClassMusicFile.fromJson(Map<String, dynamic> json) {
    return ClassMusicFile(
      fileName: json['fileName'],
      title: json['title'],
      ext: json['ext'],
      size: json["size"],
      expireTime: json["expireTime"],
      signedURI: json["signedURI"],
      unsignedURI: json["unsignedURI"],
    );
  }

  Map<String, dynamic> toFriendly() => {
        "fileName": this.fileName,
        "title": this.title,
        "ext": this.ext,
        "size": this.size,
        "expireTime": this.expireTime,
        "signedURI": this.expireTime,
        "unsignedURI": this.expireTime
      };
}

class RemoteStreamInfo {
  bool isTheInstructor =
      false; // Is this stream for the instructor of the session?
  bool isLocalPreview = false; // Is this showing a local preview?
  bool isPlaying =
      false; // Is the video currently playing (note that it can be playing but muted)?
  bool isHidden = false; // Is the video currently hidden?
  bool isSubscribed = false; // Have we subscribed to it?
  bool isMuted = true;
  bool isAudioMuted = false;
  bool isVideoMuted = false;
  bool isSpeaking = false;
  bool showControls = false; // Should we show any controls for this stream?
  bool showIndicators = false; // Should we show indicators?
  bool helpWanted = false; // Have they requested help?
  bool qos = false; // Is there a QOS problem?
  bool isFocused = false;
  bool isSpotlight = false;
  String streamId = "";
  String videoContainerId = "";
  TshUser tshUser;

  RemoteStreamInfo({
    @required this.tshUser,
  });

  factory RemoteStreamInfo.fromJson(Map<String, dynamic> json) {
    RemoteStreamInfo remoteStreamInfo = RemoteStreamInfo(
        tshUser: TshUserModel.fromJson({"userInfo": json["tshUser"]}));
    remoteStreamInfo.isTheInstructor = json["isTheInstructor"];
    remoteStreamInfo.isLocalPreview = json['isLocalPreview'];
    remoteStreamInfo.isPlaying = json['isPlaying'];
    remoteStreamInfo.isHidden = json['isHidden'];
    remoteStreamInfo.isSubscribed = json['isSubscribed'];
    remoteStreamInfo.isMuted = json['isMuted'];
    remoteStreamInfo.isAudioMuted = json['isAudioMuted'];
    remoteStreamInfo.isVideoMuted = json['isVideoMuted'];
    remoteStreamInfo.isSpeaking = json['isSpeaking'];
    remoteStreamInfo.showControls = json['showControls'];
    remoteStreamInfo.showIndicators = json['showIndicators'];
    remoteStreamInfo.helpWanted = json['helpWanted'];
    remoteStreamInfo.qos = json['qos'];
    remoteStreamInfo.isFocused = json['isFocused'];
    remoteStreamInfo.isSpotlight = json['isSpotlight'];
    remoteStreamInfo.streamId = json['streamId'];
    remoteStreamInfo.videoContainerId = json['videoContainerId'];

    return remoteStreamInfo;
  }

  Map<String, dynamic> toJson() => {
        "isTheInstructor": isTheInstructor,
        "isLocalPreview": isLocalPreview,
        "isPlaying": isPlaying,
        "isHidden": isHidden,
        "isSubscribed": isSubscribed,
        "isMuted": isMuted,
        "isAudioMuted": isAudioMuted,
        "isVideoMuted": isVideoMuted,
        "isSpeaking": isSpeaking,
        "showControls": showControls,
        "showIndicators": showIndicators,
        "helpWanted": helpWanted,
        "qos": qos,
        "isFocused": isFocused,
        "isSpotlight": isSpotlight,
        "streamId": streamId,
        "videoContainerId": videoContainerId,
        "tshUser": tshUser,
      };

  @override
  bool operator ==(other) {
    return (other is RemoteStreamInfo) &&
        other.isTheInstructor == isTheInstructor &&
        other.isLocalPreview == isLocalPreview &&
        other.isPlaying == isPlaying &&
        other.isHidden == isHidden &&
        other.isSubscribed == isSubscribed &&
        other.isMuted == isMuted &&
        other.isAudioMuted == isAudioMuted &&
        other.isVideoMuted == isVideoMuted &&
        other.isSpeaking == isSpeaking &&
        other.showControls == showControls &&
        other.showIndicators == showIndicators &&
        other.helpWanted == helpWanted &&
        other.qos == qos &&
        other.isFocused == isFocused &&
        other.isSpotlight == isSpotlight &&
        other.streamId == streamId &&
        other.videoContainerId == videoContainerId;
  }
}
