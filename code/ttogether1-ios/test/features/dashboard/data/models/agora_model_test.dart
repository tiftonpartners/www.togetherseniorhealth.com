import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/domain/entities/agora.dart';
import 'package:tsh/features/dashboard/domain/entities/session.dart';

import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final AgoraModel agoraToken = AgoraModel(
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
        helpMessage: "The instructor has been notified and will help you soon.",
      ),
      userNumber: 477);
  test(
    'should be a subclass of Agora entity',
    () async {
      // assert
      expect(agoraToken, isA<Agora>());
    },
  );

  group("Test encode / decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap = json.decode(fixture('agora.json'));
      final result = AgoraModel.fromJson(jsonMap);
      expect(result, agoraToken);
    });
    test("Should encode a valid JSON", () {
      final Map<String, dynamic> jsonMap = json.decode(fixture('agora.json'));
      final result = agoraToken.toJson();
      expect(result["token"], jsonMap["token"]);
      expect(result["userNumber"], jsonMap["userNumber"]);
    });
  });
}
