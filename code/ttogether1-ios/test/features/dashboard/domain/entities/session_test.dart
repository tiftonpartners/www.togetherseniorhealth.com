import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/domain/entities/session.dart';

import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final GenericSession genericSessionModel = GenericSession(
    sT: "ClassSession",
    sId: "604968a2bee4b21396fce730",
    createdOn: "2021-03-11T00:47:30.157Z",
    name: "Group 3, Session 1",
    acronym: "MTROBOT-BOTS3-211216",
    classId: "604968a2bee4b21396fce72e",
    seq: 1,
    provider: "AGORA",
    providerId: "MTROBOT-BOTS3-211216",
    date0Z: "2021-12-16",
    scheduledStartTime: "2021-12-16T18:00:00.000Z",
    scheduledEndTime: "2021-12-16T19:00:00.000Z",
    lobbyOpenTime: "2021-12-16T17:45:00.000Z",
    lobbyCloseTime: "2021-12-16T19:15:00.000Z",
    tz: "America/Los_Angeles",
    lobbyTimeMins: 15,
    durationMins: 60,
    instructorId: "google-oauth2|113310272186624929173",
  );

  test(
    'should be a subclass of GenericSession entity',
    () async {
      // assert
      expect(genericSessionModel, isA<GenericSession>());
    },
  );

  group("Test decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap = json.decode(fixture('session.json'));
      final result = GenericSession.fromJson(jsonMap);
      expect(result.sT, genericSessionModel.sT);
    });
  });
}
