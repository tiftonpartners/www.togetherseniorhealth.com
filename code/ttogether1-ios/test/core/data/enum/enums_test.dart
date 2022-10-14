import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/core/data/enum/enums.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/features/dashboard/domain/entities/user_info.dart';

import '../../../fixtures/fixture_reader.dart';

main() {
  group("Test if it's a Media Events", () {
    test("Should return is Media event", () {
      expect(isMediaEvent(EventType.MicOff), true);
      expect(isMediaEvent(EventType.MuteMicAll), true);
      expect(isMediaEvent(EventType.CameraOff), true);
      expect(isMediaEvent(EventType.MuteAudio), true);
      expect(isMediaEvent(EventType.MuteVideoAll), true);
      expect(isMediaEvent(EventType.MicOn), true);
      expect(isMediaEvent(EventType.UnmuteMicAll), true);
      expect(isMediaEvent(EventType.CameraOn), true);
      expect(isMediaEvent(EventType.UnmuteVideoAll), true);
      expect(isMediaEvent(EventType.UnmuteAudio), true);
      expect(isMediaEvent(EventType.AudioMuted), true);
      expect(isMediaEvent(EventType.AudioUnmuted), true);
      expect(isMediaEvent(EventType.MicOff), true);
      expect(isMediaEvent(EventType.MicOn), true);
      expect(isMediaEvent(EventType.CameraOff), true);
      expect(isMediaEvent(EventType.CameraOn), true);
      expect(isMediaEvent(EventType.MediaStatus), true);
      expect(isMediaEvent(EventType.MediaStatusAll), true);
      expect(isMediaEvent(EventType.QosAlert), true);
    });

    test("Should return an error as it's not a media event", () {
      expect(isMediaEvent(EventType.HelpWanted), false);
    });
  });

  group("Test Mute Events", () {
    test("Should return is muted event", () {
      expect(isMuteEvent(EventType.MicOff), true);
      expect(isMuteEvent(EventType.CameraOff), true);
      expect(isMuteEvent(EventType.MuteAudio), true);
      expect(isMuteEvent(EventType.MuteVideoAll), true);
      expect(isMuteEvent(EventType.AudioMuted), true);
      expect(isMuteEvent(EventType.MicOff), true);
      expect(isMuteEvent(EventType.CameraOff), true);
    });

    test("Should return an error as it's not a muted event", () {
      expect(isMuteEvent(EventType.AudioUnmuted), false);
    });
  });
  group("Test Unmute Events", () {
    test("Should return is unmuted event", () {
      expect(isUmuteEvent(EventType.UnmuteMicAll), true);
      expect(isUmuteEvent(EventType.CameraOn), true);
      expect(isUmuteEvent(EventType.UnmuteVideoAll), true);
      expect(isUmuteEvent(EventType.UnmuteAudio), true);
      expect(isUmuteEvent(EventType.AudioUnmuted), true);
      expect(isUmuteEvent(EventType.MicOn), true);
      expect(isUmuteEvent(EventType.CameraOn), true);
    });

    test("Should return an error as it's not a unmute event", () {
      expect(isUmuteEvent(EventType.MuteAudio), false);
    });
  });

  group("Test Mic Events", () {
    test("Should return as an event related to Mic feature", () {
      expect(isMicEvent(EventType.MicOff), true);
      expect(isMicEvent(EventType.MuteMicAll), true);
      expect(isMicEvent(EventType.MicOn), true);
      expect(isMicEvent(EventType.UnmuteMicAll), true);
      expect(isMicEvent(EventType.MicOff), true);
      expect(isMicEvent(EventType.MicOn), true);
    });

    test("Should return an error as it's not a mic event", () {
      expect(isMicEvent(EventType.Video), false);
    });
  });

  group("Test Mic Events", () {
    test("Should return as an event related to Mic feature", () {
      expect(isMicEvent(EventType.MicOff), true);
      expect(isMicEvent(EventType.MuteMicAll), true);
      expect(isMicEvent(EventType.MicOn), true);
      expect(isMicEvent(EventType.UnmuteMicAll), true);
      expect(isMicEvent(EventType.MicOff), true);
      expect(isMicEvent(EventType.MicOn), true);
    });

    test("Should return an error as it's not a mic event", () {
      expect(isMicEvent(EventType.Video), false);
    });
  });

  group("Test Video Events", () {
    test("Should return as an event related to Video feature", () {
      expect(isVideoEvent(EventType.CameraOff), true);
      expect(isVideoEvent(EventType.MuteVideoAll), true);
      expect(isVideoEvent(EventType.CameraOn), true);
      expect(isVideoEvent(EventType.UnmuteVideoAll), true);
      expect(isVideoEvent(EventType.CameraOff), true);
      expect(isVideoEvent(EventType.CameraOn), true);
    });

    test("Should return an error as it's not a Video event", () {
      expect(isVideoEvent(EventType.MicOff), false);
    });
  });

  group("Test View Events", () {
    test("Should return as an event related to View feature", () {
      expect(isViewEvent(EventType.ViewChanged), true);
      expect(isViewEvent(EventType.ChangeView), true);
      expect(isViewEvent(EventType.ChangeViewAll), true);
    });

    test("Should return an error as it's not a View event", () {
      expect(isViewEvent(EventType.MicOff), false);
    });
  });

  group("Test isRecording Events", () {
    test("Should return as an event related to Recording feature", () {
      expect(isRecordingEvent(EventType.Record), true);
    });

    test("Should return an error as it's not a Recording event", () {
      expect(isViewEvent(EventType.MicOff), false);
    });
  });

  group("Test isMusicEvent Events", () {
    test("Should return as an event related to Music feature", () {
      expect(isMusicEvent(EventType.Music), true);
    });

    test("Should return an error as it's not a Music event", () {
      expect(isMusicEvent(EventType.Video), false);
    });
  });

  group("Test isHelp Events", () {
    test("Should return as an event related to Requesting Help feature", () {
      expect(isHelpEvent(EventType.HelpWanted), true);
    });

    test("Should return an error as it's not a Requesting Help event", () {
      expect(isViewEvent(EventType.CameraOn), false);
    });
  });

  group("Test QoS Events", () {
    test("Should return as an event related to QoS feature", () {
      expect(isQosEvent(EventType.QosAlert), true);
    });

    test("Should return an error as it's not a QoS event", () {
      expect(isQosEvent(EventType.MicOff), false);
    });
  });

  group("Test is the event for all participants", () {
    test("Should return proper result if event is meant to be for everyone",
        () {
      expect(isForAllParticipants(EventType.NavigateAll), true);
      expect(isForAllParticipants(EventType.LogoutAll), true);
      expect(isForAllParticipants(EventType.MuteMicAll), true);
      expect(isForAllParticipants(EventType.MuteVideoAll), true);
      expect(isForAllParticipants(EventType.UnmuteMicAll), true);
      expect(isForAllParticipants(EventType.UnmuteVideoAll), true);
      expect(isForAllParticipants(EventType.MediaStatusAll), true);
    });

    test("Should return proper result if event is meant to be for everyone",
        () {
      expect(isForAllParticipants(EventType.HelpWanted), false);
    });
  });

  group("Test JSON decoding", () {
    GlobalEvent exampleEvent = GlobalEvent(
        event: "MuteMicAll",
        eventClass: "Command",
        subject: "*",
        sessionId: "MTROBOTBOTS4-211206",
        target: "");

    test("Should return a proper json map", () {
      final eventMap = json.decode(fixture('globalserviceevent.json'));
      final decodedEvent = GlobalEvent.fromJson(eventMap);
      final eventMap2 = decodedEvent.toFriendly();
      expect(eventMap["eventClass"], eventMap2["eventClass"]);
      expect(eventMap["event"], eventMap2["event"]);
      expect(eventMap["sessionId"], eventMap2["sessionId"]);
      expect(eventMap["subject"], eventMap2["subject"]);
      expect(eventMap["target"], eventMap2["target"]);
    });

    test("Should decode a global event properly", () {
      final eventMap = json.decode(fixture('globalserviceevent.json'));
      final decodedEvent = GlobalEvent.fromJson(eventMap);
      expect(decodedEvent, exampleEvent);
    });

    RemoteStreamInfo remoteStream = RemoteStreamInfo(
        tshUser: TshUser(
            userInfo: UserInfo(
      userNumber: 0,
      userDataLastSet: null,
      permissions: null,
      roles: null,
    )));

    remoteStream.isTheInstructor =
        false; // Is this stream for the instructor of the session?
    remoteStream.isLocalPreview = false; // Is this showing a local preview?
    remoteStream.isPlaying =
        false; // Is the video currently playing (note that it can be playing but muted)?
    remoteStream.isHidden = false; // Is the video currently hidden?
    remoteStream.isSubscribed = false; // Have we subscribed to it?
    remoteStream.isMuted = false;
    remoteStream.isAudioMuted = false;
    remoteStream.isVideoMuted = false;
    remoteStream.isSpeaking = false;
    remoteStream.showControls =
        false; // Should we show any controls for this stream?
    remoteStream.showIndicators = false; // Should we show indicators?
    remoteStream.helpWanted = false; // Have they requested help?
    remoteStream.qos = false; // Is there a QOS problem?
    remoteStream.isFocused = false;
    remoteStream.isSpotlight = false;
    remoteStream.streamId = "12345";
    remoteStream.videoContainerId = "12345";

    test("Should decode a remote stream info properly", () {
      final eventMap = json.decode(fixture('remoteuserinfo.json'));
      final decodedEvent = RemoteStreamInfo.fromJson(eventMap);
      expect(decodedEvent, remoteStream);
    });

    test("Should encode a remote stream info properly", () {
      final eventMap = json.decode(fixture('remoteuserinfo.json'));
      final remoteStreamMap = remoteStream.toJson();

      expect(remoteStreamMap["isTheInstructor"],
          equals(eventMap["isTheInstructor"]));
      expect(remoteStreamMap["isLocalPreview"],
          equals(eventMap["isLocalPreview"]));
      expect(remoteStreamMap["isPlaying"], equals(eventMap["isPlaying"]));
      expect(remoteStreamMap["isHidden"], equals(eventMap["isHidden"]));
      expect(remoteStreamMap["isSubscribed"], equals(eventMap["isSubscribed"]));
      expect(remoteStreamMap["isMuted"], equals(eventMap["isMuted"]));
      expect(remoteStreamMap["isAudioMuted"], equals(eventMap["isAudioMuted"]));
      expect(remoteStreamMap["isVideoMuted"], equals(eventMap["isVideoMuted"]));
      expect(remoteStreamMap["isSpeaking"], equals(eventMap["isSpeaking"]));
      expect(remoteStreamMap["showControls"], equals(eventMap["showControls"]));
      expect(remoteStreamMap["showIndicators"],
          equals(eventMap["showIndicators"]));
      expect(remoteStreamMap["helpWanted"], equals(eventMap["helpWanted"]));
      expect(remoteStreamMap["qos"], equals(eventMap["qos"]));
      expect(remoteStreamMap["isFocused"], equals(eventMap["isFocused"]));
      expect(remoteStreamMap["streamId"], equals(eventMap["streamId"]));
      expect(remoteStreamMap["isSpotlight"], equals(eventMap["isSpotlight"]));
      expect(remoteStreamMap["videoContainerId"],
          equals(eventMap["videoContainerId"]));
    });
  });
}
