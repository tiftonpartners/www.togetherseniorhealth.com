import 'dart:async';

import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:bloc/bloc.dart';
import 'package:data_connection_checker/data_connection_checker.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/constants.dart';
import 'package:agora_rtc_engine/rtc_engine.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/constants/router_path.dart';
import 'package:tsh/core/data/enum/enums.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/core/network/network_info.dart';
import 'package:tsh/core/services/global_event_service.dart';
import 'package:tsh/core/services/navigation_service.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/call_parameters.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/home_parameters.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_class_info_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_user_info_usecase.dart';
import 'package:tsh/features/dashboard/presentation/cubit/get_user_info/get_user_info_cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:agora_rtc_engine/rtc_local_view.dart' as RtcLocalView;
import 'package:agora_rtc_engine/rtc_remote_view.dart' as RtcRemoteView;
import 'package:tsh/features/dashboard/presentation/widgets/video_off_surface_widget.dart';
part 'calling_state.dart';

/// Signature of callbacks that have no arguments and return no data.
typedef VoidCallback = void Function();

class CallingCubit extends Cubit<CallingState> {
  final NavigationService navigationService;
  final GetClassInfoUsecase getClassInfoUsecase;
  final GetUserInfoUsecase getUserInfoUsecase;
  final NetworkInfo networkInfo;
  final SharedPreferencesService sharedPreferencesService;
  GlobalEventService globalEventService;

  int myUserNumber;
  RtcEngine engine;
  CallParameters callParameters;
  List<TshUser> tshUserList = [];
  List<TshUser> spotlightUsersList = List.generate(2, (index) => null);
  List<int> users = [];
  // List<String> logs = [];
  List<RemoteStreamInfo> remoteUsers = [];
  RemoteStreamInfo localUsers;

  bool collapse = false;
  bool isCheck = true;
  bool isGetHelp = false;
  bool permissionStatus = false;
  bool isOpenSocketDisconnected = false;
  bool hasConnection = true;

  String userId;

  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

  // getter

  bool get muted => this.globalEventService.localStream?.isMuted;
  bool get isAskedForHelp => this.globalEventService?.askedForHelp;
  bool get isInstructor => this.globalEventService.isTheInstructor;
  bool get isTurnOff =>
      this.globalEventService?.localStream?.isVideoMuted ?? true;
  String get currentView => this.globalEventService.currentView;
  String get socketStatus => this.globalEventService.socketStatus;
  String get customHelpMessage => this.globalEventService.customHelpMessage;

  StreamSubscription<DataConnectionStatus> internetConnection;

  CallingCubit({
    @required this.getUserInfoUsecase,
    @required this.sharedPreferencesService,
    @required this.getClassInfoUsecase,
    @required this.navigationService,
    @required this.globalEventService,
    @required this.networkInfo,
    this.callParameters,
  }) : super(CallingInitial()) {
    userId = sharedPreferencesService?.userInfo?.userInfo?.userData?.userId;
    internetConnection = networkInfo.streamInternetCalling(
      onConnect: () {},
      onSetState: () {
        _setState(() {
          if (hasConnection) return;
          hasConnection = true;
        });
      },
      onDisconnect: () {
        emit(CallingInitial());
        if (hasConnection) {
          hasConnection = false;
        }
        emit(CallingError(failure: ServerFailure(Label.NO_INTERNET)));
      },
    );

    globalEventService.getSocketResponse.listen((event) {
      print("event: $event");
      if (event['socketErorr'] == true) {
        if (hasConnection) {
          _setState(() {});
        }
        AwesomeDialog errorDialog;
        if (!isOpenSocketDisconnected) {
          isOpenSocketDisconnected = true;
          String errorMessage = event["errorMessage"].toString() ?? "";
          if (errorMessage
                  .toLowerCase()
                  .contains(("Failed host").toLowerCase()) ==
              true) {
            errorMessage = "Please check your internet connection";
          }
          errorDialog = AwesomeDialog(
            context: navigationService.navigatorKey.currentContext,
            keyboardAware: true,
            dismissOnBackKeyPress: false,
            dialogType: DialogType.ERROR,
            animType: AnimType.BOTTOMSLIDE,
            isDense: true,
            width: MediaQuery.of(navigationService.navigatorKey.currentContext)
                    .size
                    .width *
                .5,
            btnCancelText: Label.OK,
            title: Label.ERROR,
            padding: const EdgeInsets.all(16.0),
            desc: errorMessage,
            btnCancelOnPress: () {
              isOpenSocketDisconnected = false;
            },
          );
        }
        errorDialog.show();
      } else if (event['socketStatus'] != null) {
        if (hasConnection) {
          _setState(() {});
        }
      } else {
        globalEventService.handleGlobalEvent(GlobalEvent.fromJson(event));
      }
    });

    globalEventService.getStateChangeResponse.listen((event) {
      if (event == EventType.StartOver) {
        startOver();
      } else if (event == EventType.Navigate ||
          event == EventType.NavigateAll) {
        onCallEnd();
      } else if (event == EventType.Video) {
        remoteUsers = globalEventService.remoteStreams;
        _setState(() {});
      } else {
        print(event);
        _setState(() {});
      }
    });
    initialize();
  }

  onToggleGetInfo() {
    _setState(() {
      isGetHelp = !isGetHelp;
    });
  }

  Future<void> joinClass() async {
    isCheck = false;
    await engine.joinChannel(
        callParameters.agora.token,
        callParameters.agora.session.acronym,
        null,
        callParameters.agora.userNumber);
    globalEventService.socket.connect();
    _setState(() {});
  }

  Widget checkLocalVideo() {
    final localView = RtcLocalView.SurfaceView(
      renderMode: VideoRenderMode.FILL,
    );
    return localView;
  }

  Widget localView(bool isLanscape) {
    // checkPermission();
    Widget videoFrame =
        AspectRatio(aspectRatio: 9 / 16, child: checkLocalVideo());
    return isTurnOff
        ? VideoOffSurface()
        : Container(
            color: Palette.kBlack,
            child: Center(
              child: isLanscape ? checkLocalVideo() : videoFrame,
            ),
          );
  }

  Widget remoteView(int uid, {bool isInstructor = false}) {
    return RtcRemoteView.SurfaceView(
      uid: uid,
      renderMode: (isInstructor) ? VideoRenderMode.FILL : VideoRenderMode.Fit,
    );
  }

  /// Helper function to get list of native views
  List<Widget> getRenderViews(bool isLanscape) {
    bool isGroupView = currentView == EClientView.GROUP;
    final List<Widget> list =
        List.generate(isGroupView ? tshUserList.length : 2, (index) => null);
    if (isGroupView) {
      users.forEach(
        (int uid) {
          for (var i = 0; i < tshUserList.length; i++) {
            if (myUserNumber != null &&
                myUserNumber == tshUserList[i].userInfo.userNumber) {
              list[i] = isGroupView
                  ? localView(isLanscape)
                  : localUsers.isSpotlight
                      ? localView(isLanscape)
                      : null;
            } else if (tshUserList[i].userInfo.userNumber == uid) {
              List<RemoteStreamInfo> remotesList = remoteUsers
                  .where(
                      (element) => element.tshUser.userInfo.userNumber == uid)
                  .toList();
              RemoteStreamInfo remoteStreamInfo;
              if (remotesList.length > 0) {
                remoteStreamInfo = remotesList[0];
              }
              bool isInstructor =
                  remoteStreamInfo.tshUser.userInfo.userNumber ==
                      callParameters.instructorInfo.userInfo.userNumber;
              list[i] = isGroupView
                  ? remoteView(uid, isInstructor: isInstructor)
                  : remoteStreamInfo == null
                      ? null
                      : remoteStreamInfo.isSpotlight
                          ? remoteView(uid)
                          : null;
            }
          }
        },
      );
    } else {
      remoteUsers.forEach((element) {
        if (element.tshUser.userInfo.userNumber ==
            callParameters.instructorInfo.userInfo.userNumber) {
          list[0] = remoteView(element.tshUser.userInfo.userNumber,
              isInstructor: true);
          spotlightUsersList[0] = element.tshUser;
        } else if (globalEventService.currentSpotlightUserId ==
            element.tshUser.userInfo.userData.userId) {
          list[1] = remoteView(
            element.tshUser.userInfo.userNumber,
          );
          spotlightUsersList[1] = element.tshUser;
        }
      });
      if (localUsers.isSpotlight) {
        list[1] = localView(isLanscape);
        spotlightUsersList[1] = localUsers.tshUser;
      }
    }

    return list;
  }

  Future<void> checkPermission() async {
    // You can request multiple permissions at once.
    Map<Permission, PermissionStatus> statuses = await [
      Permission.camera,
      Permission.microphone,
    ].request();
    permissionStatus = !statuses[Permission.microphone].isGranted ||
        !statuses[Permission.camera].isGranted;
    if (permissionStatus) {
      openAppSettings();
    } else {
      await joinClass();
    }
  }

  Future<void> getPermission() async {
    CupertinoDialogAction dialogButton = CupertinoDialogAction(
      isDefaultAction: true,
      onPressed: () {
        openAppSettings();
      },
      child: Text(Label.CHECK_PERMISSION),
    );
    await Permission.camera.request();
    if (await Permission.camera.isGranted) {
      await Permission.microphone.request();
      if (await Permission.microphone.isDenied) {
        final errorDialog = new CupertinoAlertDialog(
          title: new Text(
            Label.ERROR,
          ),
          content: new Text(Label.MIC_PERMISSION),
          actions: <Widget>[dialogButton],
        );

        showDialog(
            context: navigationService.navigatorKey.currentContext,
            barrierDismissible: false,
            builder: (_) {
              return errorDialog;
            });
      }
    } else if (await Permission.camera.isDenied) {
      final errorDialog = new CupertinoAlertDialog(
        title: new Text(
          Label.ERROR,
        ),
        content: new Text(Label.CAM_PERMISSION),
        actions: <Widget>[dialogButton],
      );
      showDialog(
          context: navigationService.navigatorKey.currentContext,
          barrierDismissible: false,
          builder: (_) {
            return errorDialog;
          });
    }

    // return await [
    //   Permission.camera,
    //   Permission.microphone,
    // ].request();
  }

  void onSetParameters() {
    isCheck = callParameters.isCheck;
    globalEventService.callParameters = callParameters;
    localUsers = RemoteStreamInfo(tshUser: callParameters.myUserInfo);
    localUsers.isMuted = false;
    localUsers.isLocalPreview = true;
    globalEventService.setLocalStream(localUsers);
    globalEventService.isTheInstructor = callParameters.isInstructor;
    globalEventService.agora = callParameters.agora;

    tshUserList = [
      callParameters.instructorInfo,
      ...callParameters.participantsList
    ];

    _setState(() {});
  }

  void onToggleMute() {
    globalEventService.doToggleMuteClick();
  }

  void onTurnVideo() {
    globalEventService.doToggleVideoClick();
  }

  void onCallapse() {
    _setState(() {
      collapse = !collapse;
    });
  }

  Future<void> startOver() async {
    if (globalEventService.joined || isOpenSocketDisconnected) {
      await dispose();
      await navigationService.navigatorKey.currentContext
          .read<GetUserInfoCubit>()
          .onGetMyInfo(
            callParameters.classesModel,
            isCheck: false,
          );
    }
  }

  void onCallEnd() async {
    globalEventService.leftSocketChannel();
    await dispose();
    // sharedPreferencesService.setForceTime(null);
    navigationService.pushAndRemoveUntil(RoutePath.HOME,
        params: HomeParameters(
          myUserInfo: localUsers.tshUser,
        ));
  }

  Future<void> initialize() async {
    await _initAgoraRtcEngine();

    // engine.enableInEarMonitoring(true);
    // engine.setInEarMonitoringVolume(globalEventService.musicVolume);
    engine.enableAudioVolumeIndication(2000, 3, false);
    // await engine
    //     .setRemoteSubscribeFallbackOption(StreamFallbackOptions.VideoStreamLow);

    _addAgoraEventHandlers();
    await engine.enableDualStreamMode(true);
    await engine.setVideoEncoderConfiguration(VideoEncoderConfiguration(
        dimensions: VideoDimensions(width: 1280, height: 720),
        frameRate: VideoFrameRate.Fps15,
        bitrate: 500,
        orientationMode: VideoOutputOrientationMode.Adaptative));
    await engine.startPreview();
    globalEventService.setEngine(engine);
    onSetParameters();
    if (!callParameters.isCheck) {
      await joinClass();
    }
  }

  /// Create agora sdk instance and initialize
  Future<void> _initAgoraRtcEngine() async {
    engine = await RtcEngine.create(Constants.APP_ID);
    //TODO : CHECK GET CAM PERMISSION
    // if (await Permission.camera.isGranted) {
    bool cameraPermissionState = await Permission.camera.isGranted;
    await Future.delayed(Duration(seconds: cameraPermissionState ? 0 : 2),
        () async {
      await engine.enableVideo();
    });

    // }
  }

  /// Add agora event handlers
  void _addAgoraEventHandlers() {
    engine.setEventHandler(RtcEngineEventHandler(
      audioVolumeIndication:
          (List<AudioVolumeInfo> speakers, int totalVolume) async {
        if (currentView == EClientView.GROUP && await networkInfo.isConnected) {
          speakers.forEach((speaker) {
            if (speaker.uid == 0) {
              _setState(() {
                if (speaker.volume > 20) {
                  localUsers.isSpeaking = true;
                } else {
                  localUsers.isSpeaking = false;
                }
              });
            } else {
              remoteUsers.forEach((remoteUser) {
                if (speaker.uid == remoteUser.tshUser.userInfo.userNumber) {
                  _setState(() {
                    if (speaker.volume > 20) {
                      remoteUser.isSpeaking = true;
                    } else {
                      remoteUser.isSpeaking = false;
                    }
                  });
                }
              });
            }
          });
        }
      },
      tokenPrivilegeWillExpire: (String token) {
        print("this $token will be expired in 30 seconds");
      },
      localVideoStateChanged:
          (LocalVideoStreamState localVideoState, LocalVideoStreamError error) {
        print("localVideoStateChanged $localVideoState & $error");
      },
      error: (ErrorCode code) {
        final info = 'onError: $code';
        EasyLoading.dismiss();
        bool permission =
            ErrorCode.AdmNoPermission == code || ErrorCode.StartCamera == code;
        print(info);
        if (!permission) {
          final errorDialog = AwesomeDialog(
            context: navigationService.navigatorKey.currentContext,
            keyboardAware: true,
            dismissOnBackKeyPress: false,
            dialogType: DialogType.ERROR,
            animType: AnimType.BOTTOMSLIDE,
            isDense: true,
            width: MediaQuery.of(navigationService.navigatorKey.currentContext)
                    .size
                    .width *
                .5,
            btnCancelText:
                (permission) ? Label.CHECK_PERMISSION : Label.TRY_AGAIN,
            title: Label.ERROR,
            padding: const EdgeInsets.all(16.0),
            desc: ErrorCode.AdmNoPermission == code
                ? Label.MIC_PERMISSION
                : ErrorCode.StartCamera == code
                    ? Label.CAM_PERMISSION
                    : info,
            btnCancelOnPress: () {
              if (permission) {
                checkPermission();
              } else {
                startOver();
              }
            },
          );
          errorDialog.show();
        }
      },
      joinChannelSuccess: (channel, uid, elapsed) async {
        final info = 'onJoinChannel: $channel, uid: $uid';
        myUserNumber = uid;
        globalEventService.userNumber = uid;
        _setLocalUser();
        // engine.setRemoteVideoStreamType(uid, VideoStreamType.Low);
        users.add(uid);

        print(info);
        _setState(() {});
      },
      leaveChannel: (stats) {
        print("onLeaveChannel");
      },
      userJoined: (uid, elapsed) async {
        print("user number $uid joined");
        globalEventService.setRemoteStreams([]);
        users.add(uid);
        globalEventService.sendMediaStatus();
        tshUserList.forEach((element) async {
          if (uid == element.userInfo.userNumber) {
            print(element.userInfo.userData.nickname);
            final remoteUser = RemoteStreamInfo(tshUser: element);
            remoteUser.isTheInstructor =
                callParameters.agora.session.instructorId ==
                    element.userInfo.userData.userId;
            if (remoteUser.isTheInstructor) {
              if (globalEventService.localStream.isVideoMuted &&
                  globalEventService.localStream.isMuted) {
                GlobalEvent e = new GlobalEvent(
                    eventClass: EventClass.Notify, event: EventType.Inactive);
                e.subject = globalEventService
                    .localStream.tshUser.userInfo.userData.userId;
                e.sessionId = this.callParameters.agora.session.acronym;
                e.target = NO_TARGET;

                globalEventService.sendSignal(e);
              } else {
                GlobalEvent e = new GlobalEvent(
                    eventClass: EventClass.Notify, event: EventType.Active);
                e.subject = globalEventService
                    .localStream.tshUser.userInfo.userData.userId;
                e.sessionId = this.callParameters.agora.session.acronym;
                e.target =
                    "{'isEnabledVideo':${!globalEventService.localStream.isVideoMuted}, 'isEnabledAudio': ${!globalEventService.localStream.isMuted})}";

                globalEventService.sendSignal(e);
              }
            }
            remoteUser.streamId = uid.toString();
            if (!remoteUser.isHidden) {
              remoteUser.isSubscribed = true;
            }
            // engine.setRemoteVideoStreamType(
            //     uid,
            //     callParameters.agora.session.instructorId ==
            //             element.userInfo.userData.userId
            //         ? VideoStreamType.High
            //         : VideoStreamType.Low);

            remoteUsers.add(remoteUser);

            print(
                "usernumber_sendsignal: uid -> $uid, name -> ${element.userInfo.userData.name}");
            // Request that the remote send their media status
            GlobalEvent e = new GlobalEvent(
                eventClass: EventClass.Command, event: EventType.MediaStatus);
            String userId = element.userInfo.userData.userId;
            e.subject = userId;
            e.sessionId = this.callParameters.agora.session.acronym;
            globalEventService.sendSignal(e);

            globalEventService.setRemoteStreams(remoteUsers);
          }
        });

        _setState(() {});
      },
      userOffline: (uid, reason) {
        print("userOffline: uid -> $uid, name -> $reason");
        _setState(() {
          remoteUsers.removeWhere(
              (element) => element.tshUser.userInfo.userNumber == uid);
          users.remove(uid);
        });
      },
      firstRemoteVideoFrame: (uid, width, height, elapsed) {
        print("firstRemoteVideoFrame: $uid, $width, $height");
      },
    ));
  }

  void _setState(VoidCallback onRender) {
    emit(CallingInitial());
    onRender();
    emit(CallingLoaded());
  }

  void _setLocalUser() {
    engine.muteLocalAudioStream(muted);
    engine.muteLocalVideoStream(isTurnOff);
  }

  Future<void> dispose() async {
    if (engine != null) {
      print("calling close");
      try {
        await engine?.stopPreview();
        await engine?.leaveChannel();
        await engine?.destroy();
      } catch (e) {
        print(e);
      }

      await internetConnection?.cancel();
      await globalEventService?.dispose();
      engine = null;
    }
  }

  @override
  Future<void> close() async {
    await dispose();
    return super.close();
  }

  // Initialize local stream and publish it to the channel
  publishLocalStreams(String userNumber, String userId) async {
    print(
        '(publishLocalStreams) Start userNumber: $userNumber userId: $userId, isAudioEnabled: ${this.globalEventService.isAudioEnabled}');

    final videoProfilesHigh = VideoEncoderConfiguration(
        dimensions: VideoDimensions(width: 1280, height: 720),
        frameRate: VideoFrameRate.Fps15,
        bitrate: 1130,
        orientationMode: VideoOutputOrientationMode.Adaptative);

    final videoProfilesLow = VideoEncoderConfiguration(
        dimensions: VideoDimensions(width: 320, height: 240),
        frameRate: VideoFrameRate.Fps15,
        bitrate: 200,
        orientationMode: VideoOutputOrientationMode.Adaptative);

    await this.engine.setVideoEncoderConfiguration(
        (this.globalEventService.isTheInstructor == true)
            ? videoProfilesHigh
            : videoProfilesLow);
    // enable camera/mic, this will bring up permission dialog for first time
    await this.engine.enableLocalAudio(true);
    await this.engine.enableLocalVideo(true);
  }
}
