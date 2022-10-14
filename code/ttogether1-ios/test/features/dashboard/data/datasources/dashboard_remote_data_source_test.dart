import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:http/testing.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;
import 'package:tsh/core/error/exceptions.dart';
import 'package:tsh/core/network/network_call.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';
import 'package:tsh/features/dashboard/data/models/user_data_model.dart';
import 'package:tsh/features/dashboard/data/models/user_info_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

import 'package:shared_preferences_platform_interface/shared_preferences_platform_interface.dart';
import 'package:tsh/injection_container.dart';
import '../../../../fixtures/fixture_reader.dart';
import '../../../../injection_container_test.dart';

class MockNetworkCall extends Mock implements NetworkCall {}

main() {
  FakeSharedPreferencesStore store;
  MockNetworkCall mockNetworkCall = MockNetworkCall();
  DashboardRemoteDataSourceImpl dataSource;
  final accronym = "MTIOS1G1-211201";
  final accronymNotExisting = "MTIOS1G1-001201";

  final String jwtRandom = "jwtRandom";
  final String accronymRandom = "MTIOS1G1-211201";
  final String ticketRandom =
      "WkxU_s9YlsUAj_7_Yeyr9l6ws3HhsMGvVWyhWCl3-MbA9evbQ7Yp-i7slUGmwEvp";
  final String forceTimeRandom = "2021-03-30T20:48:22.343Z";
  /*
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
        helpMessage: "The instructor has been notified and will help you soon.",
      ),
      userNumber: 477);
      
  final ClassesModel classModelRandom = ClassesModel(sId: "TSH-001");
  final String userIdRandom = "477";
  final TshUser userInfo = TshUser(
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
          1629704638386));
  */
  setUp(() async {
    store = FakeSharedPreferencesStore({});
    SharedPreferencesStorePlatform.instance = store;

    //make sure the instance is cleared before each test
    await GetIt.I.reset();
    store.log.clear();

    await init();

    mockNetworkCall = MockNetworkCall();
    dataSource = DashboardRemoteDataSourceImpl(
        networkCall: NetworkCall(
          client: MockClient((http.Request request) async {
            String pathCalled = request.url.path;
            print("request is $pathCalled");
            if (pathCalled.contains("v1/pwdless/token/")) {
              // We will return same response forcetime set or not
              return http.Response(fixture('token.json'), 200);
            }
            if (pathCalled.contains("v1/video/agora/token/")) {
              // We will return same response forcetime set or not
              return http.Response(fixture('agora.json'), 200);
            }
            if (pathCalled.contains("v1/video/agora/adhoc-token/")) {
              // We will return same response forcetime set or not
              return http.Response(fixture('agora.json'), 200);
            }
            if (pathCalled.contains("v1/classes/acronym/")) {
              // We will return same response forcetime set or not
              // Grab the accronym and simulate error if it's wrong one
              if (request.url.pathSegments.last.compareTo(accronym) == 0) {
                return http.Response(fixture('details.json'), 200);
              }
              return http.Response(
                  "{\"message\": \"The accronym doesn't exist!\"}", 404);
            }
            if (pathCalled.contains("v1/classes/me/upcoming")) {
              // We will return same response forcetime set or not
              return http.Response(fixture('upcoming.json'), 200);
            }
            if (pathCalled.contains("v1/adhoc-sessions/upcoming")) {
              // We will return same response forcetime set or not
              return http.Response(fixture('upcoming.json'), 200);
            }
            if (pathCalled.contains("v1/users")) {
              // We will return same response forcetime set or not
              return http.Response(fixture('userinfo.json'), 200);
            }
            // final tUpcomingModel = json.decode(fixture('upcoming.json'));
            // final tDetailsModel = json.decode(fixture('details.json'));

            return http.Response(
                "{\"message\": \"The API endpoint called doesn't exist\"}",
                404);
          }),
          preference: MockSharedPreferencesService(),
        ),
        sharedPreferencesService: sl());
  });

  group("createJwt", () {
    final tJWTModel = json.decode(fixture('token.json'));

    test('should create a JWT Token from a ticket', () async {
      final result =
          await dataSource.createJwt(ticket: ticketRandom, shouldSave: true);
      expect(result, tJWTModel["token"]);
    });
    test('should create a JWT Token from a ticket and forceTime for testing',
        () async {
      final result = await dataSource.createJwt(
          ticket: ticketRandom, forceTime: forceTimeRandom, shouldSave: true);
      expect(result, tJWTModel["token"]);
      expect(sl<SharedPreferencesService>().bearerToken, equals(result));
    });
    test('should create a an agora Token from JWT for a given acronym',
        () async {
      // act
      final result =
          await dataSource.createSecuredAgoraToken(accronym: accronym);
      expect(result.token, isNotNull);
      expect(result.session.acronym, equals(accronym));
    });
    test('should create a an agora Token', () async {
      // act
      final result = await dataSource.createAgoraToken(jwt: jwtRandom);
      expect(result, isNotNull);
    });
  });

  group('getAgoraToken', () {
    final agoraModel = AgoraModel.fromJson(json.decode(fixture('agora.json')));

    test(
      '''should perform a GET request on a URL with authorized JWT in header ''',
      () async {
        // act
        final response = await dataSource.createAgoraToken(jwt: jwtRandom);
        // assert
        expect(response, equals(agoraModel));
      },
    );
  });

  group("upcomingClasses", () {
    final tUpcomingModel = json.decode(fixture('upcoming.json'));
    final tDetailsModel = json.decode(fixture('details.json'));
    test('should get the list of upcoming classes for a user', () async {
      final result = await dataSource.upcomingClasses();
      // We have at least one class
      final firstClass = result.first;
      expect(firstClass, isA<ClassesModel>());
      expect(firstClass.courseId, isNotNull);
      expect(firstClass.acronym, isNotNull);
      expect(firstClass.program, isNotNull);
      expect(firstClass.sId, isNotNull);
    });
    test('should get forced time stored for testing', () async {
      await sl<SharedPreferencesService>().setForceTime(forceTimeRandom);
      final result = await dataSource.getForceTime();
      expect(result, forceTimeRandom);
    });
    test(
        'should get the list of upcoming classes with no forced time and no stored time for a user.. the normal case scenario',
        () async {
      await sl<SharedPreferencesService>().setForceTime(null);
      final result = await dataSource.upcomingClasses();
      // We have at least one class
      final firstClass = result.first;
      expect(firstClass, isA<ClassesModel>());
      expect(firstClass.courseId, isNotNull);
      expect(firstClass.acronym, isNotNull);
      expect(firstClass.program, isNotNull);
      expect(firstClass.sId, isNotNull);
    });
    test(
        'should get the list of upcoming classes with a forced time for testing for a user',
        () async {
      final result =
          await dataSource.upcomingClasses(forceTime: forceTimeRandom);
      // We have at least one class
      final firstClass = result.first;
      expect(firstClass, isA<ClassesModel>());
      expect(firstClass.courseId, isNotNull);
      expect(firstClass.acronym, isNotNull);
      expect(firstClass.program, isNotNull);
      expect(firstClass.sId, isNotNull);
    });
    test(
        "should return the forced time stored when it was retrieving the upcoming class",
        () async {
      await sl<SharedPreferencesService>().setForceTime(forceTimeRandom);
      final result = await dataSource.upcomingClasses();
      // We have at least one class
      final firstClass = result.first;
      expect(firstClass, isA<ClassesModel>());
      expect(firstClass.courseId, isNotNull);
      expect(firstClass.acronym, isNotNull);
      expect(firstClass.program, isNotNull);
      expect(firstClass.sId, isNotNull);
    });
    test('should get the list of adhoc cupcoming classes for a user', () async {
      final result = await dataSource.upcomingAdhocClasses();
      final firstClass = result.first;
      expect(firstClass, isA<ClassesModel>());
      expect(firstClass.courseId, isNotNull);
      expect(firstClass.acronym, isNotNull);
      expect(firstClass.program, isNotNull);
      expect(firstClass.sId, isNotNull);
    });
    test('should get the list of upcoming classes for a user and a forced time',
        () async {
      final result =
          await dataSource.upcomingClasses(forceTime: forceTimeRandom);
      final firstClass = result.first;
      expect(firstClass, isA<ClassesModel>());
      expect(firstClass.courseId, isNotNull);
      expect(firstClass.acronym, isNotNull);
      expect(firstClass.program, isNotNull);
      expect(firstClass.sId, isNotNull);
    });
    test('should get the class info', () async {
      ClassesModel firstClass =
          await dataSource.getClassInfo(class1Acronym: accronym);
      expect(firstClass, isA<ClassesModel>());
      expect(firstClass.courseId, isNotNull);
      expect(firstClass.acronym, isNotNull);
      expect(firstClass.program, isNotNull);
      expect(firstClass.sId, isNotNull);
    });

    test('should return an error as accronym is invalid', () async {
      final call = dataSource.getClassInfo;
      expect(call(class1Acronym: accronymNotExisting),
          throwsA(isA<ServerException>()));
    });

    test('should get a valid class structure', () async {
      ClassesModel classInfo =
          await dataSource.getClassInfo(class1Acronym: accronym);

      assert(classInfo.participants.length > 0);
      assert(classInfo.acronym != null && classInfo.acronym.isNotEmpty);
      assert(
          classInfo.instructorId != null && classInfo.instructorId.isNotEmpty);
      assert(classInfo.courseId != null && classInfo.courseId.isNotEmpty);
    });
  });

  test("should retrieve a previously set forced time", () async {
    await dataSource.createJwt(
        ticket: ticketRandom, shouldSave: true, forceTime: forceTimeRandom);
    expect(sl<SharedPreferencesService>().forceTime, forceTimeRandom);
  });

  test("should be able to set and get the user information", () async {
    TshUserModel userModel =
        await dataSource.getUserInfo(user2Id: "512", isId: true);

    expect(userModel.userInfo.userNumber, equals(0));
    expect(userModel.userInfo.userData, isNull);
    expect(userModel.userInfo.permissions, isNull);
    expect(userModel.userInfo.roles, isNull);
    expect(userModel.userInfo.userDataLastSet, equals(0));
  });
}
