import 'dart:async';

import 'package:agora_rtc_engine/rtc_engine.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:mutex/mutex.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:socket_io_client/socket_io_client.dart';
import 'package:tsh/constants/constants.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/core/data/enum/enums.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/domain/entities/agora.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/call_parameters.dart';
import 'package:tsh/injection_container.dart';

class GlobalEventService {
  final Mutex streamsChangeMutex = Mutex();
  StreamController socketResponse = StreamController<Map<String, dynamic>>();
  StreamController stateChangeResponse = StreamController<String>();
  Stream<Map<String, dynamic>> get getSocketResponse => socketResponse.stream;
  Stream<String> get getStateChangeResponse => stateChangeResponse.stream;
  IO.Socket socket;
  RtcEngine engine;

  bool isAudioEnabled = true;
  bool isTheInstructor = false;
  bool isRecording = false;
  bool isSpotlighting = false;
  bool askedForHelp = false;
  bool isMusicPlaying = false;
  bool toggleMusicGuard = false;
  bool allMutedRemotely = false; // Is everybody put on mute?
  bool joined = false; //socket status joined

  String currentView = EClientView.GROUP;
  String currentSpotlightUserId; // What user are we spotlighting?
  String sessionAcronym;
  String customHelpMessage =
      'The instructor has been notified that you need help.';
  String username = "";
  String socketStatus;
  String musicState = MusicState.STOPPED;

  List<ClassMusicFile> musicFiles = [];
  ClassMusicFile selectedMusic;

  int musicVolume = 20;
  int userNumber;

  List<RemoteStreamInfo> remoteStreams = [];
  RemoteStreamInfo localStream;
  Agora agora;
  CallParameters callParameters;
  final Agora agoraCon;

  void addResponse(Map<String, dynamic> data) {
    socketResponse.sink.add(data);
  }

  void addStateChangeResponse(String data) {
    stateChangeResponse.sink.add(data);
  }

  Future<void> leftSocketChannel({int milli = 0}) async {
    if (this.joined) {
      // Nofify that we've left the old session
      this.joined = false;
      Future.delayed(Duration(milliseconds: milli), () {
        sendSignal(GlobalEvent(
            eventClass: EventClass.Notify,
            event: EventType.SessionLeft,
            subject: localStream.tshUser.userInfo.userData.userId,
            target: sl<SharedPreferencesService>().forceTime == null
                ? ""
                : {"forceTime": sl<SharedPreferencesService>().forceTime},
            sessionId: this.sessionAcronym));
        sendSignal(GlobalEvent(
          eventClass: EventClass.Notify,
          event: EventType.LoggedOut,
          sessionId: this.sessionAcronym,
          subject: localStream.tshUser.userInfo.userData.nickname,
          target: localStream.tshUser.userInfo.userData.userId,
        ));
      });
    }
  }

  Future<void> dispose() async {
    socket.dispose();
    await socketResponse.close();
    await stateChangeResponse.close();
  }

  GlobalEventService(this.agoraCon) {
    // const String server = 'http://192.168.100.207:4000';
    // const String server = 'https://mt1-api.test.tsh.care';
    // const String server = 'https://mt1-api.prod.tsh.care';
    setAgora(this.agoraCon);
    socket = IO.io(
        Constants.BASE_URL,
        // <String, dynamic>{
        //   "transports": ["websocket"],
        //   "autoConnect": false,
        //   "timeout": 45000
        // }
        OptionBuilder()
            .setTransports(['websocket']) // for Flutter or Dart VM
            .disableAutoConnect() // disable auto-connection
            // .setTimeout(45000)
            // .disableReconnection()
            .build());
    socket.onConnect((data) {
      // addResponse({"isOnline": true});
      socketStatus = SocketStatus.Connected;
      showSocketStatus();
      onJoinSignal();
      doAskForHelpClick(target: 'off');
      sendMediaStatus();
      print('connected ${socket.id}');
    });
    socket.on('message', (data) {
      print("message $data");
      addResponse(data);
    });
    socket.onConnectTimeout((data) {
      print("onConnectTimeout $data");
      socketStatus = SocketStatus.TIME_OUT;
      addResponse({"socketErorr": true, "errorMessage": Label.INTERNET_CONNECTION_ERROR});
    });
    socket.onConnectError((data) async {
      print("onConnectError $data");
      //in case alert got spam so we need to delay it a little bit
      await Future.delayed(Duration(milliseconds: 3000), () {
        socketStatus = SocketStatus.Error;
        return addResponse({"socketErorr": true, "errorMessage": Label.INTERNET_CONNECTION_ERROR});
      });
    });

    socket.onError((data) async {
      print("onConnectError $data");
      //in case alert got spam so we need to delay it a little bit
      await Future.delayed(Duration(milliseconds: 3000), () {
        socketStatus = SocketStatus.Error;
        return addResponse({"socketErorr": true, "errorMessage": Label.INTERNET_CONNECTION_ERROR});
      });
    });

    socket.onReconnecting((data) {
      print("reconnecting");
      socketStatus = SocketStatus.Reconnecting;
      showSocketStatus();
      // addResponse({"isReconnecting": true});
    });

    socket.onDisconnect((_) {
      print("disconnected");
      if (joined) {
        print("disconnected join");

        socketStatus = SocketStatus.Disconnected;
        showSocketStatus();
      }
    });
  }

  void showSocketStatus() {
    EasyLoading.dismiss();
    addResponse({"socketStatus": socketStatus});
  }

  Future<void> onJoinSignal({int milli = 0}) async {
    joined = true;
    Future.delayed(Duration(milliseconds: milli), () {
      sendSignal(GlobalEvent(
        eventClass: EventClass.Notify,
        event: EventType.LoggedIn,
        subject: localStream.tshUser.userInfo.userData.nickname,
        sessionId: this.sessionAcronym,
        target: localStream.tshUser.userInfo.userData.userId,
      ));
      String forceTime;
      if (sl.isRegistered<SharedPreferencesService>() == true) {
        if (sl<SharedPreferencesService>() != null) {
          forceTime = sl<SharedPreferencesService>().forceTime;
        } else {
          forceTime = null;
        }
      }
      sendSignal(GlobalEvent(
          eventClass: EventClass.Notify,
          event: EventType.SessionJoined,
          subject: localStream.tshUser.userInfo.userData.userId,
          target: forceTime == null ? "" : {"forceTime": forceTime},
          sessionId: this.sessionAcronym));
    });
  }

  sendSignal(GlobalEvent evt) {
    try {
      if (evt.target == null) {
        return;
      }
      socket.emit('message', evt.toFriendly());
      // addLog("Socket > send > ${evt.toFriendly()}");

      if (evt.subject != SERVER) handleGlobalEvent(evt);
    } catch (error, stackTrace) {
      // print('listenTo error: $error');
    }
  }

  handleGlobalEvent(GlobalEvent evt) async {
    bool isNotify = evt.eventClass == EventClass.Notify;
    bool isCommand = evt.eventClass == EventClass.Command;

    if (isForAllParticipants(evt.event) && isTheInstructor) {
      // print('(evt) Instructor ignores: ${evt.toFriendly()}');
      return;
    }

    // addLog("Socket > receive > ${evt.toFriendly()}");

    if (isNotify && evt.subject != username) {
      print("NOTIFY: ${evt.toFriendly()}");
      if (isMediaEvent(evt.event)) {
        // We need to reflect this event in the UI
        remoteStreams.forEach((remoteStream) {
          if (remoteStream.tshUser.userInfo.userData.userId == evt.subject) {
            if (isMicEvent(evt.event)) {
              if (isMuteEvent(evt.event)) {
                // remoteStream.micBtn.mute();
                remoteStream.isMuted = true;
                remoteStream.isSpeaking = false;

                addStateChangeResponse("Muted: ${remoteStream.isMuted}");
              } else if (isUmuteEvent(evt.event)) {
                // remoteStream.micBtn.unmute();
                remoteStream.isMuted = false;
                addStateChangeResponse("Muted: ${remoteStream.isMuted}");
              }
            } else if (isVideoEvent(evt.event)) {
              if (isMuteEvent(evt.event)) {
                remoteStream.isVideoMuted = true;
                // remoteStream.videoBtn.mute();
              } else if (isUmuteEvent(evt.event)) {
                remoteStream.isVideoMuted = false;
                // remoteStream.videoBtn.unmute();
              }
              addStateChangeResponse(EventType.Video);
            } else if (isQosEvent(evt.event)) {
              remoteStream.qos = evt.target == 'on';
            }
          }
        });
      } /*
      // we dont handle recording events at the moment
       else if (isRecordingEvent(evt.event)) {
        if (evt.target == ERecordEvent.ON) {
          isRecording = true;
        } else {
          isRecording = false;
        }
      }*/
      else if (isHelpEvent(evt.event)) {
        RemoteStreamInfo stream =
            (this.remoteStreams == null || this.remoteStreams?.length == 0)
                ? null
                : this.remoteStreams?.firstWhere((streamItem) {
                    return streamItem.tshUser.userInfo.userData.userId ==
                        evt.subject;
                  });
        if (stream != null) {
          RemoteStreamInfo s = stream;
          s.helpWanted = evt.target == 'on';
          addStateChangeResponse(evt.event);
        }
      }
    }

    if (isCommand &&
        (evt.subject == username ||
            evt.subject == ANY_SUBJECT ||
            evt.subject == "-")) {
      GlobalEvent notice = GlobalEvent(
        eventClass: EventClass.Notify,
        event: EventType.Unknown,
      );

      notice.sessionId = evt.sessionId;
      notice.subject = this.localStream.tshUser.userInfo.userData.userId;

      switch (evt.event) {
        case EventType.Navigate:
        case EventType.NavigateAll:
          print("(evt) Navigating to:${evt.target}");
          addStateChangeResponse(evt.event);
          break;
        case EventType.ChangeView:
        case EventType.ChangeViewAll:
          await streamsChangeMutex.acquire();
          print("(evt) Changing view to:${evt.target}");
          try {
            if (evt.target.startsWith('spot')) {
              String temp = evt.target;
              String userId = temp.substring(5);
              this.switchToSpotlight(userId);
            }
            switch (evt.target) {
              case EClientView.GROUP:
                this.switchToGroup();
                break;
              case EClientView.INSTRUCTOR:
                this.switchToInstructor();
                break;
            }
          } catch (e) {
            print("error: $e");
          } finally {
            streamsChangeMutex.release();
          }
          sendMediaStatus();
          break;
        case EventType.MicOff:
        case EventType.MuteMicAll:
          engine.muteLocalAudioStream(true);
          localStream?.isMuted = true;
          localStream?.isSpeaking = false;
          print(
              "EventType.MuteMic > ${!this.localStream.isVideoMuted} / ${!this.localStream.isMuted}");
          notice.event = EventType.MicOff;
          if (localStream.isVideoMuted) {
            GlobalEvent e = new GlobalEvent(
                eventClass: EventClass.Notify, event: EventType.Inactive);
            e.subject = localStream.tshUser.userInfo.userData.userId;
            e.sessionId = this.callParameters.agora.session.acronym;
            e.target = NO_TARGET;

            sendSignal(e);
          }

          addStateChangeResponse(EventType.MicOff);
          break;
        case EventType.MicOn:
        case EventType.UnmuteMicAll:
          engine.muteLocalAudioStream(false);
          localStream?.isMuted = false;
          print(
              "EventType.UnmuteMic > ${!this.localStream.isVideoMuted} / ${!this.localStream.isMuted}");
          notice.event = EventType.MicOn;
          GlobalEvent e = new GlobalEvent(
              eventClass: EventClass.Notify, event: EventType.Active);
          e.subject = localStream.tshUser.userInfo.userData.userId;
          e.sessionId = this.callParameters.agora.session.acronym;
          e.target =
              "{'isEnabledVideo':${!this.localStream.isVideoMuted}, 'isEnabledAudio': ${!this.localStream.isMuted})}";

          sendSignal(e);
          addStateChangeResponse(EventType.MicOn);
          break;

        case EventType.CameraOff:
        case EventType.MuteVideoAll:
          // await engine.enableLocalVideo(false);
          engine.muteLocalVideoStream(true);
          localStream?.isVideoMuted = true;
          notice.event = EventType.CameraOff;
          if (localStream.isMuted) {
            print(
                "EventType.MuteVideo > ${!this.localStream.isVideoMuted} / ${!this.localStream.isMuted}");
            // notice.event = EventType.UnmuteMic;
            GlobalEvent e = new GlobalEvent(
                eventClass: EventClass.Notify, event: EventType.Inactive);
            e.subject = localStream.tshUser.userInfo.userData.userId;
            e.sessionId = this.callParameters.agora.session.acronym;
            e.target = NO_TARGET;
            sendSignal(e);
          }
          addStateChangeResponse(EventType.CameraOff);
          break;
        case EventType.CameraOn:
        case EventType.UnmuteVideoAll:
          // engine.enableLocalVideo(true);
          engine.muteLocalVideoStream(false);
          localStream?.isVideoMuted = false;
          notice.event = EventType.CameraOn;
          print(
              "EventType.UnmuteVideo > ${!this.localStream.isVideoMuted} / ${!this.localStream.isMuted}");
          GlobalEvent e = new GlobalEvent(
              eventClass: EventClass.Notify, event: EventType.Active);
          e.subject = localStream.tshUser.userInfo.userData.userId;
          e.sessionId = this.callParameters.agora.session.acronym;
          e.target =
              "{'isEnabledVideo':${!this.localStream.isVideoMuted}, 'isEnabledAudio': ${!this.localStream.isMuted})}";
          sendSignal(e);

          addStateChangeResponse(EventType.CameraOn);
          break;
        case EventType.MuteAudio:
          remoteStreams.forEach((element) {
            engine.muteRemoteAudioStream(
                element.tshUser.userInfo.userNumber, true);
          });
          engine.muteLocalAudioStream(true);
          localStream?.isAudioMuted = true;
          break;
        case EventType.UnmuteAudio:
          remoteStreams.forEach((element) {
            engine.muteRemoteAudioStream(
                element.tshUser.userInfo.userNumber, false);
          });
          engine.muteLocalAudioStream(false);
          localStream?.isAudioMuted = false;
          break;
        case EventType.MediaStatus:
        case EventType.MediaStatusAll:
          sendMediaStatus();
          break;
        case EventType.Music:
          break;
        // NOTE: we are handling music on the ipad app.. we removing this code to improve code coverage
        /*
          // An event to play or pause music.
          switch (evt.target) {
            case EMusicEvent.PLAY:
              switch (this.musicState) {
                case MusicState.PLAYING:
                  // G2G
                  this.toggleMusicGuard = false;
                  break;
                case MusicState.PAUSED:
                  // Resume audio mixing
                  engine.resumeAudioMixing().then((value) {
                    print('(music) Audio Mixing Resumed');
                    this.musicState = MusicState.PLAYING;
                    this.isMusicPlaying = true;
                    this.toggleMusicGuard = false;
                  }).catchError((err) {
                    if (err) {
                      print('(music) ERROR Resuming Audio Mixing: $err');
                    }
                  });

                  break;
                case MusicState.STOPPED:
                  // Start Audio mixing on new file
                  // Starts audio mixing.
                  // this.snackBarRef = this.snackBar.open('Loading music...', 'Ok');
                  engine
                      .startAudioMixing("filePath", true, false, 0)
                      .then((value) {
                    // if (this.snackBarRef) {
                    //                     this.snackBarRef.dismiss();
                    //                     this.snackBarRef = undefined;
                    //                   }
                    print(
                        "(music) Audio mixing started for title: ${this.selectedMusic.title}");
                    engine.adjustAudioMixingVolume(this.musicVolume);
                    this.musicState = MusicState.PLAYING;
                    this.isMusicPlaying = true;
                    this.toggleMusicGuard = false;
                  }).catchError((err) {
                    if (err) {
                      print('(music) ERROR starting audio mixing: $err');
                    }
                  });
              }
              break; // End, PLAY event
            case EMusicEvent.PAUSE:
              switch (this.musicState) {
                case MusicState.PLAYING:
                  engine.pauseAudioMixing().then((value) {
                    print('(music) Audio Mixing Paused');
                    this.musicState = MusicState.PAUSED;
                    this.isMusicPlaying = false;
                    this.toggleMusicGuard = false;
                  }).catchError((err) {
                    if (err) {
                      print('(music) ERROR Pausing Audio Mixing: $err');
                    }
                  });

                  break;
                case MusicState.PAUSED:
                case MusicState.STOPPED:
                  // G2G
                  this.toggleMusicGuard = false;
                  break;
              }
              break;
            case EMusicEvent.STOP:
              switch (this.musicState) {
                case MusicState.PLAYING:
                case MusicState.PAUSED:
                  engine.stopAudioMixing().then((value) {
                    print('(music) Audio Mixing Stopped');
                    this.musicState = MusicState.STOPPED;
                    this.isMusicPlaying = false;
                    this.toggleMusicGuard = false;
                  }).catchError((err) {
                    if (err) {
                      print('(music) ERROR Stopping Audio Mixing: $err');
                    }
                  });

                  break;
                case MusicState.STOPPED:
                  this.toggleMusicGuard = false;
                  // G2G
                  break;
              }
              break;

            default:
              print(
                  'ERROR: Unknown Music event target in event: $evt, null, 2');
              break;
          }
          break;
          */
        case EventType.MusicVolume:
          setMusicVolume(evt.target);
          break;
        case EventType.HelpWanted:
          this.askedForHelp = evt.target == 'on';
          notice.event = EventType.HelpWanted;
          notice.target = evt.target;
          addStateChangeResponse(evt.event);
          break;
        case EventType.SetHelpMessage:
          print('(evt) SetHelp ${evt.toFriendly()}');
          this.customHelpMessage = evt.target;
          addStateChangeResponse(evt.event);
          break;
        case EventType.StartOver:
          addStateChangeResponse(evt.event);
          break;
        default:
          print("No case");
          break;
      }
      if (notice.event != EventType.Unknown) {
        sendSignal(notice);
      }
    }
  }

  /// The selected music has changed.
  /// @param event
  doMusicSelected(ClassMusicFile selectedMusic) {
    print('(doMusicSelected) Music Selected: $selectedMusic, null, 2');
    GlobalEvent globalEvent = new GlobalEvent(
      eventClass: EventClass.Command,
      event: EventType.Music,
    );
    globalEvent.subject = ANY_SUBJECT;
    globalEvent.target = EMusicEvent.STOP;
    globalEvent.sessionId = this.sessionAcronym;
    sendSignal(globalEvent);

    this.selectedMusic = selectedMusic;
  }

  /// Subclasses override this to do things when the
  /// askForHelp status changes

  /// Click action for the help button
  doAskForHelpClick({String target}) {
    GlobalEvent helpEvent = GlobalEvent(
      eventClass: EventClass.Command,
      event: EventType.HelpWanted,
    );
    helpEvent.subject = this.localStream.tshUser.userInfo.userData.userId;
    helpEvent.sessionId = this.sessionAcronym;
    helpEvent.target = target == null
        ? this.askedForHelp
            ? 'off'
            : 'on'
        : target;
    sendSignal(helpEvent);
  }

  /// Event handler when the Spotlight button is clicked for a specific
  /// video

  /// Toggle local stream Mute
  GlobalEvent doToggleMuteClick() {
    String eventType =
        this.localStream.isMuted ? EventType.MicOn : EventType.MicOff;
    engine.muteLocalAudioStream(!this.localStream.isMuted);
    this.localStream.isMuted = !this.localStream.isMuted;
    GlobalEvent sentEvent = this._buildGlobalEvent(eventType);
    return sentEvent;
    // addLog("agora > send > doToggleMuteClick");
  }

  /// Toggle Local stream video
  GlobalEvent doToggleVideoClick() {
    String eventType = this.localStream.isVideoMuted
        ? EventType.CameraOn
        : EventType.CameraOff;
    if (this.localStream.isVideoMuted) {
      engine.muteLocalVideoStream(false);
    } else {
      engine.muteLocalVideoStream(true);
    }
    this.localStream.isVideoMuted = !this.localStream.isVideoMuted;
    GlobalEvent sentEvent = this._buildGlobalEvent(eventType);
    return sentEvent;
  }

  /// Create a Global event and send it to the Observable
  GlobalEvent _buildGlobalEvent(String eventType, {String targetUser}) {
    GlobalEvent globalEvent =
        GlobalEvent(eventClass: EventClass.Command, event: eventType);
    globalEvent.subject = this.localStream.tshUser.userInfo.userData.userId;
    globalEvent.target = NO_TARGET;
    globalEvent.sessionId = this.sessionAcronym;

    sendSignal(globalEvent);
    return globalEvent;
  }

  /// Set the volume level for music playing
  /// @param volume
  setMusicVolume(int volume) {
    print('(music) Volume Level: $volume');
    if (this.isMusicPlaying) {
      engine.adjustAudioMixingVolume(volume);
    }
  }

  // Send the state of the current media buttons over the
  // global event bus
  // @dev: we need to return something for unit testing
  List<GlobalEvent> sendMediaStatus() {
    if (localStream == null) {
      return [];
    }
    List<GlobalEvent> eventsSent = [];
    GlobalEvent isMutedEvent = GlobalEvent(
        eventClass: EventClass.Notify,
        event: this.localStream.isMuted
            ? EventType.MicOff
            : EventType.MicOn);
    isMutedEvent.subject = this.localStream.tshUser.userInfo.userData.userId;
    isMutedEvent.sessionId = sessionAcronym;
    sendSignal(isMutedEvent);
    eventsSent.add(isMutedEvent);

    GlobalEvent isVideoMutedEvent = GlobalEvent(
        eventClass: EventClass.Notify,
        event: this.localStream.isVideoMuted
            ? EventType.CameraOff
            : EventType.CameraOn);
    isVideoMutedEvent.subject =
        this.localStream.tshUser.userInfo.userData.userId;
    isVideoMutedEvent.sessionId = sessionAcronym;
    sendSignal(isVideoMutedEvent);
    eventsSent.add(isVideoMutedEvent);

    // Are we asking for help?
    GlobalEvent helpEvent = GlobalEvent(
      eventClass: EventClass.Notify,
      event: EventType.HelpWanted,
    );
    helpEvent.subject = this.localStream.tshUser.userInfo.userData.userId;
    helpEvent.sessionId = sessionAcronym;
    helpEvent.target = this.askedForHelp ? 'on' : 'off';
    sendSignal(helpEvent);
    eventsSent.add(helpEvent);

    return eventsSent;
  }

  /// Spotlight a specific user, turning off the video view of
  /// all other users
  /// @param userId User ID who's video is to be spotlighted

  switchToSpotlight(String userId) {
    print('(switchToSpotlight) user: $userId');
    this.currentView = EClientView.SPOTLIGHT;
    this.isSpotlighting = true;
    this.currentSpotlightUserId = userId;

    this.remoteStreams.forEach((remoteStream) {
      remoteStream.isSpotlight =
          remoteStream.tshUser.userInfo.userData.userId == userId ||
              remoteStream.isTheInstructor;
      if (this.isTheInstructor) {
        // Nothing is hidden/shown for the instructor
      } else {
        if (remoteStream.tshUser.userInfo.userData.userId == userId ||
            remoteStream.isTheInstructor) {
          engine.muteRemoteVideoStream(
              remoteStream.tshUser.userInfo.userNumber, false);
          // I'm being spotlighted - how exciting!
          remoteStream.isSpotlight = true;
          this.showRemoteStream(remoteStream);
        } else {
          engine.muteRemoteVideoStream(
              remoteStream.tshUser.userInfo.userNumber, true);
          this.hideRemoteStream(remoteStream);
          remoteStream.isSpotlight = false;
        }
      }
    });
    if (localStream.tshUser.userInfo.userData.userId == userId) {
      localStream.isSpotlight = true;
    } else {
      localStream.isSpotlight = false;
    }
    addStateChangeResponse(currentView);
  }

  /// Switch to Instructor view - spotlighting the instructor only
  switchToInstructor() {
    print("(switchToInstructor) isTheInstructor: ${this.isTheInstructor}");
    this.currentView = EClientView.INSTRUCTOR;
    this.isSpotlighting = true;
    this.currentSpotlightUserId = null;

    this.remoteStreams.forEach((remoteStream) {
      remoteStream.isSpotlight = remoteStream.isTheInstructor;
      if (this.isTheInstructor) {
        // Nothing changes for the instructor
      } else {
        if (remoteStream.isTheInstructor) {
          this.currentSpotlightUserId =
              remoteStream.tshUser.userInfo.userData.userId;
          engine.muteRemoteVideoStream(
              remoteStream.tshUser.userInfo.userNumber, false);
          this.showRemoteStream(remoteStream);
        } else {
          engine.muteRemoteVideoStream(
              remoteStream.tshUser.userInfo.userNumber, true);
          this.hideRemoteStream(remoteStream);
        }
        // remoteStream.stream.close();
      }
    });
    addStateChangeResponse(currentView);
  }

  // Switch to Group view - showing all users

  switchToGroup() {
    print('(switchToGroup)');
    engine.muteAllRemoteVideoStreams(false);
    this.currentView = EClientView.GROUP;
    this.currentSpotlightUserId = null;
    this.isSpotlighting = false;

    this.remoteStreams.forEach((remoteStream) {
      remoteStream.isSpotlight = false;
      this.showRemoteStream(remoteStream);
    });
    localStream.isSpotlight = false;
    addStateChangeResponse(currentView);
  }

  showRemoteStream(RemoteStreamInfo remoteStream) {
    remoteStream.isHidden = false;
    if (remoteStream.isLocalPreview) {
      return;
    }
  }

  hideRemoteStream(RemoteStreamInfo remoteStream) {
    print(
        "isHidden: ${remoteStream.isHidden},isLocalPreview:${remoteStream.isLocalPreview}");
    if (remoteStream.isHidden) {
      return;
    }

    // Nothing more for local preview
    remoteStream.isHidden = true;
    if (remoteStream.isLocalPreview || !remoteStream.isSubscribed) {
      return;
    }
    remoteStream.isSubscribed = false;
    remoteStream.isPlaying = false;
  }

  setEngine(RtcEngine engine) {
    this.engine = engine;
  }

  setRemoteStreams(List<RemoteStreamInfo> users) {
    remoteStreams = users;
  }

  setLocalStream(RemoteStreamInfo user) {
    localStream = user;
    username = user.tshUser.userInfo.userData.userId;
  }

  void setAgora(Agora agora) {
    this.agora = agora;
    this.sessionAcronym = agora.session.acronym;
  }
}
