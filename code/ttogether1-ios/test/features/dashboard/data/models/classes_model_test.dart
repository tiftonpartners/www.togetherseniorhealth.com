import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/data/models/app_meta_data_model.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/domain/entities/instructor.dart';
import 'package:tsh/features/dashboard/domain/entities/schedule.dart';
import 'package:tsh/features/dashboard/domain/entities/start_time.dart';

import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final ClassesModel classModel = ClassesModel(
    participants: [
      "auth0|6049601481454200709b4817",
      "auth0|5fc5553e3b76180068de1d4e",
      "auth0|5fc5553daf785a00698336c4",
      "auth0|5fc5553ca7674a006e94c83f",
      "auth0|5fc5553aa7674a006e94c83a",
      "auth0|5fc55539d5c13c006f0bfe27"
    ],
    createdOn: "2021-03-11T00:47:30.154Z",
    program: "OTHER",
    sId: "604968a2bee4b21396fce72e",
    sessions: [
      SessionModel(
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
      )
    ],
    name: "Group 3",
    acronym: "MTROBOT-BOTS3",
    lobbyTimeMins: 15,
    durationMins: 60,
    instructorId: "google-oauth2|113310272186624929173",
    helpMessage: "The instructor has been notified and will help you soon.",
    checkPageHelpMessage:
        "Please call the community manager at (xxx)-xxx-xxxx for help",
    courseId: "6036957b2d4fe83755f8893e",
    iV: 138,
    capacity: 8,
    instructor: Instructor(
      email: "cbradley@togetherseniorhealth.com",
      name: "Chrisanne Bradley",
      nickname: "cbradley",
      picture:
          "https://lh3.googleusercontent.com/a-/AOh14Ggx7QRKOE3SyxRLfOwwcnFycsw6hYdWTR_F7aE1=s96-c",
      userId: "google-oauth2|113310272186624929173",
      appMetadata:
          AppMetadataModel("RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP"),
    ),
    numSessions: 1,
    schedule: Schedule(
        startTime: StartTime(hour: 10, mins: 0, tz: "America/Los_Angeles"),
        weekdays: ["tue", "thu"],
        sId: "604968a2bee4b21396fce72f"),
    startDate0Z: "2021-12-15",
  );

  test(
    'should be a subclass of ClassModel entity',
    () async {
      // assert
      expect(classModel, isA<ClassesModel>());
    },
  );

  group("Test encode / decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap = json.decode(fixture('class.json'));
      final result = ClassesModel.fromJson(jsonMap);
      expect(result, classModel);
    });


   // TODO: Add more properties check
    test("Should encode a valid JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('class.json'));
      final result = classModel.toJson();
      expect(result["_id"], jsonMap["_id"]);
      expect(result["program"], jsonMap["program"]);
      expect(result["createdOn"], jsonMap["createdOn"]);
      expect(result["startDate0Z"], jsonMap["startDate0Z"]);
      expect(result["acronym"], jsonMap["acronym"]);
      expect(result["durationMins"], jsonMap["durationMins"]);
      expect(result["lobbyTimeMins"], jsonMap["lobbyTimeMins"]);
      expect(result["numSessions"], jsonMap["numSessions"]);
      expect(result["capacity"], jsonMap["capacity"]);
      expect(result["courseId"], jsonMap["courseId"]);
      expect(result["instructorId"], jsonMap["instructorId"]);
      expect(result["name"], jsonMap["name"]);
      expect(result["helpMessage"], jsonMap["helpMessage"]);
      expect(result["helpMessage"], jsonMap["helpMessage"]);
      expect(result["helpMessage"], jsonMap["helpMessage"]);
      expect(result["__v"], jsonMap["__v"]);
    });
  });
}
