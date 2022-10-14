import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get_it/get_it.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:socket_io_client/socket_io_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/constants/constants.dart';
import 'package:tsh/core/data/enum/enums.dart';
import 'package:tsh/core/services/global_event_service.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/data/models/user_data_model.dart';
import 'package:tsh/features/dashboard/data/models/user_info_model.dart';
import 'package:tsh/features/dashboard/domain/entities/agora.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/call_parameters.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:agora_rtc_engine/rtc_engine.dart';

import 'package:shared_preferences_platform_interface/shared_preferences_platform_interface.dart';
import 'package:tsh/injection_container.dart';

import '../../injection_container_test.dart';

class MockStream extends Mock implements Stream<GlobalEvent> {}

class MockGlobalEventService extends Mock implements GlobalEventService {
  GlobalEventService globalEventService;
  MockGlobalEventService(Agora agoraCon) {
    globalEventService = GlobalEventService(agoraCon);
    globalEventService.socket.connect();
  }
}

void main() {
  MockGlobalEventService clientMock;
  Agora agora;
  RemoteStreamInfo localStream;
  RemoteStreamInfo remoteStream;
  RtcEngine engine;
  MethodChannel channel;
  FakeSharedPreferencesStore store;

  setUp(() async {
    store = FakeSharedPreferencesStore({});
    SharedPreferencesStorePlatform.instance = store;

    //make sure the instance is cleared before each test
    await GetIt.I.reset();
    store.log.clear();

    await init();

    channel = MethodChannel('agora_rtc_engine');
    WidgetsFlutterBinding.ensureInitialized();

    channel.setMockMethodCallHandler((MethodCall methodCall) async {
      print("methodCall $methodCall");
      if (methodCall.toString().compareTo("getAudioMixingPublishVolume") == 0) {
        return '0';
      }
      return '42';
    });

    remoteStream = RemoteStreamInfo(
        tshUser: TshUser(
            userInfo: UserInfoModel(
                500,
                "",
                UserDataModel(
                    "2021-03-11T00:11:00.696Z",
                    "server1-2@togetherseniorhealth.com",
                    false,
                    [],
                    "Server 1, Stream 2",
                    "server1-2",
                    "https://s.gravatar.com/avatar/05e52276748c99ea234ec425dc0eda1b?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fse.png",
                    "2021-06-15T21:51:04.235Z",
                    "auth0|6049601481454200709b4820",
                    "server1-2",
                    null),
                null,
                null,
                1629704638389)));
    remoteStream.helpWanted = false;
    remoteStream.isAudioMuted = false;
    remoteStream.isFocused = false;
    remoteStream.isHidden = false;
    remoteStream.isLocalPreview = true;
    remoteStream.isMuted = false;
    remoteStream.isPlaying = false;
    remoteStream.isSpeaking = false;
    remoteStream.isSpotlight = false;
    remoteStream.streamId = "";

    localStream = RemoteStreamInfo(
        tshUser: TshUser(
            userInfo: UserInfoModel(
                477,
                "",
                UserDataModel(
                    "2021-03-11T00:11:00.696Z",
                    "server1-1@togetherseniorhealth.com",
                    false,
                    [],
                    "Server 1, Stream 1",
                    "server1-1",
                    "https://s.gravatar.com/avatar/05e52276748c99ea234ec425dc0eda1b?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fse.png",
                    "2021-06-15T21:51:04.235Z",
                    "auth0|6049601481454200709b4817",
                    "server1-1",
                    null),
                null,
                null,
                1629704638386)));
    localStream.helpWanted = false;
    localStream.isAudioMuted = false;
    localStream.isFocused = false;
    localStream.isHidden = false;
    localStream.isLocalPreview = true;
    localStream.isMuted = false;
    localStream.isPlaying = false;
    localStream.isSpeaking = false;
    localStream.isSpotlight = false;
    localStream.streamId = "";

    final AgoraModel agoraModel = AgoraModel(
        token:
            "006dfe198af53c442bda1ab2dda95cc932cIADmsww8Gl2xDFEsUCevaz8CfTraxGMRPXDYf4+5KhMnueNl7qhlkZn0IgB4fj2x7jgeYQQAAQCOAx1hAgCOAx1hAwCOAx1hBACOAx1h",
        sessionModel: SessionModel(
          sT: "ClassSession",
          createdOn: "2021-03-30T20:48:22.343Z",
          sId: "60638e9681071200042d95af",
          name: "Moving Together (IOS) - Group 1, Session 1",
          acronym: "MTIOS1G1-211201",
          classId: "60638e5a81071200042d95ac",
          seq: 1,
          provider: "AGORA",
          providerId: "MTIOS1G1-211201",
          date0Z: "2021-12-01",
          scheduledStartTime: "2021-12-01T19:00:00.000Z",
          scheduledEndTime: "2021-12-01T20:00:00.000Z",
          lobbyOpenTime: "2021-12-01T18:45:00.000Z",
          lobbyCloseTime: "2021-12-01T20:15:00.000Z",
          tz: "America/Los_Angeles",
          lobbyTimeMins: 15,
          durationMins: 60,
          instructorId: "auth0|6063865c77b322006822b2d0",
          helpMessage:
              "The instructor has been notified and will help you soon.",
        ),
        userNumber: 477);

    agora = Agora(
        session: SessionModel(
            acronym: "MTIOS1G1-211201",
            classId: "60638e5a81071200042d95ac",
            createdOn: "2021-03-30T20:48:22.343Z",
            date0Z: "2021-12-01",
            durationMins: 60,
            helpMessage:
                "The instructor has been notified and will help you soon.",
            instructorId: "auth0|6063865c77b322006822b2d0",
            lobbyCloseTime: "2021-12-01T20:15:00.000Z",
            lobbyOpenTime: "2021-12-01T18:45:00.000Z",
            lobbyTimeMins: 15,
            name: "Moving Together (IOS) - Group 1, Session 1",
            provider: "AGORA",
            providerId: "MTIOS1G1-211201",
            sId: "60638e9681071200042d95af",
            sT: "ClassSession",
            scheduledEndTime: "2021-12-01T20:00:00.000Z",
            scheduledStartTime: "2021-12-01T19:00:00.000Z",
            seq: 1,
            tz: "America/Los_Angeles"),
        token:
            "006dfe198af53c442bda1ab2dda95cc932cIAD2NkhTU+codKek+dT0PuNWNFBX043TFIiHGDdXqtws7ONl7qhlkZn0IgAs5IwZRKMkYQQAAQDkbSNhAgDkbSNhAwDkbSNhBADkbSNh",
        userNumber: 477);

    // Initialize the clientMock
    clientMock = MockGlobalEventService(agora);
    clientMock.globalEventService.localStream = localStream;
    clientMock.globalEventService.remoteStreams.add(localStream);
    clientMock.globalEventService.remoteStreams.add(remoteStream);
    clientMock.globalEventService.username = "auth0|6049601481454200709b4817";
    clientMock.globalEventService.callParameters =
        CallParameters(agora: agoraModel);
    engine = await RtcEngine.create(Constants.APP_ID);
    clientMock.globalEventService.setEngine(engine);
  });

  group("testGetterSetter", () {
    test("should return a stream for the transmitting the socket response", () {
      expect(
        clientMock.globalEventService.getSocketResponse,
        isA<Stream<Map<String, dynamic>>>(),
      );
    });
  });

  group("testAgora", () {
    const channel = MethodChannel('agora_rtc_engine');

    TestWidgetsFlutterBinding.ensureInitialized();

    setUp(() async {
      channel.setMockMethodCallHandler((MethodCall methodCall) async {
        print("methodCall $methodCall");
        return '42';
      });

      engine = await RtcEngine.create(Constants.APP_ID);

      engine.setEventHandler(RtcEngineEventHandler(
        audioVolumeIndication:
            (List<AudioVolumeInfo> speakers, int totalVolume) async {
          print("audioVolumeIndication");
        },
        localVideoStateChanged: (LocalVideoStreamState localVideoState,
            LocalVideoStreamError error) {
          print("localVideoStateChanged $localVideoState & $error");
        },
        error: (ErrorCode code) {
          print("error $code");
        },
        joinChannelSuccess: (channel, uid, elapsed) async {
          print(
              "joinChannelSuccess  channel:$channel uid: $uid elapsed: $elapsed ");
        },
        leaveChannel: (stats) {
          print("onLeaveChannel");
        },
        userJoined: (uid, elapsed) async {
          print("userJoined uid: $uid elapsed: $elapsed");
        },
        userOffline: (uid, reason) {
          print("userOffline uid: $uid reason: $reason");
        },
      ));
    });

    test('should connect to agora', () async {
      final token =
          "006dfe198af53c442bda1ab2dda95cc932cIADQmoDB5Wnhtd2zF7qUZho2oUXJQPZ2E9g1gXRK2QmPyuNl7qhlkZn0IgC6b/MWM0wmYQQAAQDTFiVhAgDTFiVhAwDTFiVhBADTFiVh";
      final acronym = "MTIOS1G1-211201";
      final userNumber = 477;

      await engine.joinChannel(token, acronym, null, userNumber);
      Future.delayed(Duration(seconds: 2));
      final callId = await engine.getCallId();
      print("callId $callId");
      expect(callId, isNotNull);
    });
  });

  group("TestEventStream", () {
    test("Should change video status", () async {
      bool isVideoMuted =
          clientMock.globalEventService.localStream.isVideoMuted;
      clientMock.globalEventService.doToggleVideoClick();
      bool newIsVideoMuted =
          clientMock.globalEventService.localStream.isVideoMuted;
      expect(isVideoMuted, equals(!newIsVideoMuted));
      // Reverse now
      clientMock.globalEventService.doToggleVideoClick();
      expect(isVideoMuted, equals(!newIsVideoMuted));
    });
    test("Should change mic status", () async {
      bool isMuted = clientMock.globalEventService.localStream.isMuted;
      clientMock.globalEventService.doToggleMuteClick();
      bool newIsMuted = clientMock.globalEventService.localStream.isMuted;
      expect(isMuted, equals(!newIsMuted));
      // Reverse now
      clientMock.globalEventService.doToggleMuteClick();
      expect(isMuted, equals(!newIsMuted));
    });
    test("Should notify events to ", () async {
      // Need to simulate there's music being played
      // clientMock.globalEventService.isMusicPlaying = true;
      // clientMock.globalEventService.setMusicVolume(0);
      // final currentVolume = await clientMock.globalEventService.engine
      //     .getAudioMixingPublishVolume();
      // print(currentVolume);
      // expectAsync0(callback)(currentVolume, equals(0));
    });
    test("Should send the media status", () {
      List<GlobalEvent> statusSent =
          clientMock.globalEventService.sendMediaStatus();

      Future.delayed(Duration(milliseconds: 200));

      expect(statusSent.length, equals(3));
      GlobalEvent isMutedEvent = statusSent[0];
      GlobalEvent isVideoMutedEvent = statusSent[1];
      GlobalEvent helpEvent = statusSent[2];
      expect(
          isMutedEvent.subject,
          equals(clientMock.globalEventService.localStream.tshUser.userInfo
              .userData.userId));
      bool isMuted = clientMock.globalEventService.localStream.isMuted;
      expect(isMutedEvent.event,
          equals(isMuted ? EventType.MicOff : EventType.MicOn));
      expect(isMutedEvent.eventClass, equals(EventClass.Notify));

      expect(
          isVideoMutedEvent.subject,
          equals(clientMock.globalEventService.localStream.tshUser.userInfo
              .userData.userId));
      bool isVideoMuted =
          clientMock.globalEventService.localStream.isVideoMuted;
      expect(isVideoMutedEvent.event,
          equals(isVideoMuted ? EventType.CameraOff : EventType.CameraOn));
      expect(isMutedEvent.eventClass, equals(EventClass.Notify));

      expect(
          helpEvent.subject,
          equals(clientMock.globalEventService.localStream.tshUser.userInfo
              .userData.userId));
      expect(helpEvent.event, equals(EventType.HelpWanted));
      expect(helpEvent.eventClass, equals(EventClass.Notify));
    });
    test("Should switch to spotlight", () {
      clientMock.globalEventService.switchToSpotlight("477");
      GlobalEventService service = clientMock.globalEventService;
      expect(service.currentView, equals(EClientView.SPOTLIGHT));
      expect(service.isSpotlighting, equals(true));
    });
    test("Should switch to instructor", () {
      clientMock.globalEventService.switchToInstructor();
      GlobalEventService service = clientMock.globalEventService;
      expect(service.currentView, equals(EClientView.INSTRUCTOR));
      expect(service.isSpotlighting, equals(true));
      expect(service.currentSpotlightUserId, isNull);
    });
    test("Should switch to group", () {
      clientMock.globalEventService.switchToGroup();
      GlobalEventService service = clientMock.globalEventService;
      expect(service.currentView, equals(EClientView.GROUP));
      expect(service.isSpotlighting, equals(false));
      expect(service.currentSpotlightUserId, isNull);
    });
    test("Hide remote streams", () {
      clientMock.globalEventService.hideRemoteStream(remoteStream);
      expect(remoteStream.isSubscribed, equals(false));
      expect(remoteStream.isSubscribed, equals(false));
    });
    test("Should set remote streams", () {
      clientMock.globalEventService
          .setRemoteStreams([localStream, remoteStream]);
      expect(clientMock.globalEventService.remoteStreams.first,
          equals(localStream));
      expect(clientMock.globalEventService.remoteStreams.last,
          equals(remoteStream));
    });
  });

  group("testWebSocket", () {
    _testConnection() async {
      await Future.delayed(Duration(seconds: 2));
      clientMock.globalEventService.socket
          .onConnect((data) => print("Data test $data"));

      int signalCount = 0;
      clientMock.globalEventService.socketResponse.stream
          .asBroadcastStream()
          .listen((jsonMap) {
        print("jsonMap $jsonMap");

        final event = jsonMap["event"];
        final socketStatus = jsonMap["socketStatus"];
        if (event != null || socketStatus != null) {
          print("socketStatus IS $socketStatus");
          print("event IS $event");
          if (signalCount == 0) expect(socketStatus, "Connected");
          if (signalCount == 1) expect(jsonMap["event"], "CV");
          if (signalCount == 2) {
            expect(jsonMap["event"], "SH");
          }
          signalCount++;
        }
        clientMock.addResponse(jsonMap);
      });

      await Future.delayed(Duration(seconds: 1));
      clientMock.globalEventService.socket
          .onConnect((data) => print("Data test $data"));
    }

    test("Should send signals to the sockets", () {
      clientMock.globalEventService.doMusicSelected(ClassMusicFile(
        fileName: "wave.mp3",
        title: "wave",
      ));
    });

    test(
        'should establish a connection / send a message and disconnect through websocket',
        () async {
      await _testConnection();
    });

    test("should simulate an ending call and clear things properly", () async {
      clientMock.globalEventService.joined = true;
      await clientMock.globalEventService.leftSocketChannel();
      expect(clientMock.globalEventService.joined, equals(false));
      // globalEventService.leftSocketChannel();
    });

    test("Shoudl handle signals properly when receiving a GlobalEvent",
        () async {
      // We want to cover more code by setting this
      clientMock.globalEventService.localStream.isVideoMuted = true;

      // Start creating signals to be handled
      GlobalEvent muteMicEvent =
          clientMock.globalEventService.doToggleMuteClick();
      clientMock.globalEventService.handleGlobalEvent(muteMicEvent);
      expect(clientMock.globalEventService.localStream.isMuted, equals(true));
      expect(
          clientMock.globalEventService.localStream.isSpeaking, equals(false));

      GlobalEvent unmuteMicEvent =
          clientMock.globalEventService.doToggleMuteClick();
      clientMock.globalEventService.handleGlobalEvent(unmuteMicEvent);
      expect(clientMock.globalEventService.localStream.isMuted, equals(false));

      // We want to cover more code by setting this
      // clientMock.globalEventService.localStream.isMuted = true;
      clientMock.globalEventService.localStream.isVideoMuted = false;

      GlobalEvent muteCameraEvent =
          clientMock.globalEventService.doToggleVideoClick();
      clientMock.globalEventService.handleGlobalEvent(muteCameraEvent);
      expect(
          clientMock.globalEventService.localStream.isVideoMuted, equals(true));

      GlobalEvent unmuteCameraEvent =
          clientMock.globalEventService.doToggleVideoClick();
      clientMock.globalEventService.handleGlobalEvent(unmuteCameraEvent);
      expect(clientMock.globalEventService.localStream.isVideoMuted,
          equals(false));

      // We want to cover more code coverage
      clientMock.globalEventService.localStream.isMuted = true;
      clientMock.globalEventService.handleGlobalEvent(unmuteCameraEvent);
      expect(clientMock.globalEventService.localStream.isVideoMuted,
          equals(false));

      // We want to cover more code coverage (Video)
      muteCameraEvent.event = EventType.CameraOff;
      clientMock.globalEventService.localStream.isMuted = true;
      clientMock.globalEventService.handleGlobalEvent(muteCameraEvent);
      expect(clientMock.globalEventService.localStream.isVideoMuted,
          equals(true));

      GlobalEvent muteAudioEvent = muteMicEvent;
      muteAudioEvent.event = EventType.MuteAudio;
      clientMock.globalEventService.handleGlobalEvent(muteAudioEvent);
      expect(
          clientMock.globalEventService.localStream.isAudioMuted, equals(true));

      GlobalEvent unmuteAudioEvent = muteMicEvent;
      muteAudioEvent.event = EventType.UnmuteAudio;
      clientMock.globalEventService.handleGlobalEvent(unmuteAudioEvent);
      expect(clientMock.globalEventService.localStream.isAudioMuted,
          equals(false));

      GlobalEvent changeViewEvent = muteMicEvent;
      changeViewEvent.event = EventType.ChangeView;
      changeViewEvent.target = "spot" + clientMock.globalEventService.username;
      clientMock.globalEventService.handleGlobalEvent(changeViewEvent);

      await Future.delayed(Duration(milliseconds: 100));

      GlobalEventService service = clientMock.globalEventService;
      expect(service.currentView, equals(EClientView.SPOTLIGHT));
      expect(service.isSpotlighting, equals(true));

      changeViewEvent.event = EventType.ChangeView;
      changeViewEvent.target = EClientView.GROUP;
      clientMock.globalEventService.handleGlobalEvent(changeViewEvent);

      await Future.delayed(Duration(milliseconds: 100));
      expect(service.currentView, equals(EClientView.GROUP));
      expect(service.isSpotlighting, equals(false));
      expect(service.currentSpotlightUserId, isNull);

      changeViewEvent.target = EClientView.INSTRUCTOR;
      clientMock.globalEventService.handleGlobalEvent(changeViewEvent);

      await Future.delayed(Duration(milliseconds: 100));

      expect(service.currentView, equals(EClientView.INSTRUCTOR));
      expect(service.isSpotlighting, equals(true));
      expect(service.currentSpotlightUserId, isNull);

      GlobalEvent setHelpEvent = changeViewEvent;
      setHelpEvent.target = "hello there i need some help!";
      setHelpEvent.event = EventType.SetHelpMessage;
      clientMock.globalEventService.handleGlobalEvent(setHelpEvent);

      expect(service.customHelpMessage, equals(setHelpEvent.target));

      GlobalEvent startOverEvent = changeViewEvent;
      startOverEvent.event = EventType.StartOver;
      clientMock.globalEventService.handleGlobalEvent(startOverEvent);

      // We don't expect the Agora Engine ID to be different
      final callId = await engine.getCallId();
      print("callId $callId");
      expect(callId, isNotNull);

      // Testing the notify part
      GlobalEvent notifyEvent = GlobalEvent(eventClass: EventClass.Notify);
      notifyEvent.subject = remoteStream.tshUser.userInfo.userData.userId;

      // NOTE! we should do in a loop the expect instead of checking against the last element
      // Test a mute remote streams
      notifyEvent.event = EventType.MicOff;
      clientMock.globalEventService.handleGlobalEvent(notifyEvent);

      expect(clientMock.globalEventService.remoteStreams.last.isMuted, true);
      expect(
          clientMock.globalEventService.remoteStreams.last.isSpeaking, false);

      // Test a unmute remote streams
      notifyEvent.event = EventType.MicOn;
      clientMock.globalEventService.handleGlobalEvent(notifyEvent);
      expect(clientMock.globalEventService.remoteStreams.last.isMuted, false);

      // Test stop camera remote streams
      notifyEvent.event = EventType.CameraOff;
      clientMock.globalEventService.handleGlobalEvent(notifyEvent);
      expect(
          clientMock.globalEventService.remoteStreams.last.isVideoMuted, true);

      // Test show again camera remote streams
      notifyEvent.event = EventType.CameraOn;
      clientMock.globalEventService.handleGlobalEvent(notifyEvent);
      expect(
          clientMock.globalEventService.remoteStreams.last.isVideoMuted, false);

      // Test QoS on remote streams
      notifyEvent.event = EventType.QosAlert;
      notifyEvent.target = "on";
      clientMock.globalEventService.handleGlobalEvent(notifyEvent);
      expect(clientMock.globalEventService.remoteStreams.first.qos, false);
      expect(clientMock.globalEventService.remoteStreams.last.qos, true);

      // Test Help wanted on remote streams
      notifyEvent.event = EventType.HelpWanted;
      notifyEvent.target = "on";
      clientMock.globalEventService.handleGlobalEvent(notifyEvent);
      expect(
          clientMock.globalEventService.remoteStreams.first.helpWanted, false);
      expect(clientMock.globalEventService.remoteStreams.last.helpWanted, true);

      // Test an unmute remote streams
    });
  });

  tearDownAll(() async {
    clientMock.globalEventService.socket.disconnect();
    await clientMock.dispose();
  });
}
