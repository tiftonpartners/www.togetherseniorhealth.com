import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_test/flutter_test.dart';
import 'package:http/testing.dart';
import 'package:tsh/core/error/exceptions.dart';
import 'package:tsh/core/network/network_call.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';

import '../../fixtures/fixture_reader.dart';
import 'package:mockito/mockito.dart';

class MockSharedPreferencesService extends Mock
    implements SharedPreferencesService {}

class MockNetworkCall extends Mock implements NetworkCall {}

main() {
  NetworkCall networkCall;
  final forceTime = "2021-12-01T20:15:00.000Z";
  final ticket =
      "D-P9kYs6er0OW69oNr_NR-j71XfcdN39dObjhQ9042UxmeskxJRQNphVwVU9lxn8";
  final jwt =
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL210MS1hcGkudGVzdC50c2guY2FyZSIsInN1YiI6ImF1dGgwfDYwNDk2MDE0ODE0NTQyMDA3MDliNDgxNyIsInhpZCI6IiIsImF1ZCI6Imh0dHBzOi8vbXQxLWFwaS50ZXN0LnRzaC5jYXJlIiwiaWF0IjoxNjEzNDMzODg3LCJleHAiOjg2NDAwMDAwMDAwMDAsImF6cCI6InZJeEtQS09LdG16bUgybEFLSllwVDcxNk1rcTJCcVVjIiwiZ3R5IjoicHdkbGVzcyIsInJvbGUiOiJwd2RsZXNzUGFydGljaXBhbnQiLCJ0dHkiOiJ1c2VyIiwiY2xzIjoiLSIsInBlcm1pc3Npb25zIjpbImdldDpjbGFzcyIsImdldDpjb3Vyc2UiLCJnZXQ6c2Vzc2lvbiIsImdldDp0aWNrZXQiLCJnZXQ6dXNlciIsInF1ZXJ5TWU6c2Vzc2lvbiIsInF1ZXJ5TWU6dXBjb21pbmdDbGFzcyIsInF1ZXJ5TWU6dXBjb21pbmdTZXNzaW9uIl0sImh0dHBzOi8vdDEudHNoLmNvbS9uaWNrbmFtZSI6InNlcnZlcjEtMSIsImh0dHBzOi8vdDEudHNoLmNvbS9uYW1lIjoiU2VydmVyIDEsIFN0cmVhbSAxIiwiaHR0cHM6Ly90MS50c2guY29tL3BpY3R1cmUiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci8wNWU1MjI3Njc0OGM5OWVhMjM0ZWM0MjVkYzBlZGExYj9zPTQ4MCZyPXBnJmQ9aHR0cHMlM0ElMkYlMkZjZG4uYXV0aDAuY29tJTJGYXZhdGFycyUyRnNlLnBuZyJ9.Pjr6FjYNhUFPQqzWJBJdmGIz_hogic00skkRM1460wAEI5_vxVph2Cqy41pvNBNXrQNH7kNL59sQdT38YSybtw";
  final accronym = "MTIOS1G1-211201";
  final accronymNotExisting = "MTIOS1G1-001201";
  setUp(() {
    //Future<Response> Function(Request request)
    networkCall = NetworkCall(
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
            "{\"message\": \"The API endpoint called doesn't exist\"}", 404);
      }),
      preference: MockSharedPreferencesService(),
    );
  });

  group("createJwt", () {
    final tJWTModel = json.decode(fixture('token.json'));

    test('should create a JWT Token from a ticket', () async {
      // act
      final result = await networkCall.createJwt(ticket);
      final resultJson = json.decode(result);

      // assert
      expect(resultJson["token"], tJWTModel["token"]);
    });
    test('should create a JWT Token from a ticket and forceTime for testing',
        () async {
      // act
      final result = await networkCall.createJwt(ticket, forceTime: forceTime);
      final resultJson = json.decode(result);

      // assert
      expect(resultJson["token"], tJWTModel["token"]);
    });
    test('should create a an agora Token', () async {
      // act
      final result = await networkCall.createAgoraToken(jwt);
      final resultJson = json.decode(result);

      // assert
      expect(resultJson["token"], isNotNull);
      expect(resultJson["session"], isNotNull);
      expect(resultJson["userNumber"], isNotNull);
    });
    test('should create a an agora adhoc Token from an acronym', () async {
      // act
      final result = await networkCall.createAgoraAdhocToken(accronym);
      final resultJson = json.decode(result);

      // assert
      expect(resultJson["token"], isNotNull);
      expect(resultJson["session"], isNotNull);
      expect(resultJson["userNumber"], isNotNull);
    });
  });

  group("userInformation", () {
    test("should retrieve the user information", () async {
      final result = await networkCall.getUserInfo(user2Id: "512");
      Map<String, dynamic> data = jsonDecode(result);
      TshUserModel userModel = TshUserModel.fromJson(data);
      expect(userModel.userInfo.userNumber, equals(0));
      expect(userModel.userInfo.userData, isNull);
      expect(userModel.userInfo.permissions, isNull);
      expect(userModel.userInfo.roles, isNull);
      expect(userModel.userInfo.userDataLastSet, equals(0));
    });
  });

  group("upcomingClasses", () {
    final tUpcomingModel = json.decode(fixture('upcoming.json'));
    final tDetailsModel = json.decode(fixture('details.json'));
    test('should get the list of upcoming classes for a user', () async {
      final result = await networkCall.upcomingClasses();
      final resultJson = json.decode(result);
      expect(resultJson, tUpcomingModel);
    });
    test('should get the list of adhoc cupcoming classes for a user', () async {
      final result =
          await networkCall.upcomingAdhocClasses(forceTime: forceTime);
      final resultJson = json.decode(result);
      expect(resultJson, tUpcomingModel);
    });
    test('should get the list of upcoming classes for a user and a forced time',
        () async {
      final result = await networkCall.upcomingClasses(forceTime: forceTime);
      final resultJson = json.decode(result);
      expect(resultJson, tUpcomingModel);
    });
    test('should get the class info', () async {
      final result = await networkCall.getClassInfo(class1Acronym: accronym);
      final resultJson = json.decode(result);
      expect(resultJson, tDetailsModel);
    });

    test('should return an error as accronym is invalid', () async {
      final call = networkCall.getClassInfo;
      expect(call(class1Acronym: accronymNotExisting),
          throwsA(isA<ServerException>()));
    });

    test('should get a valid class structure', () async {
      final result = await networkCall.getClassInfo(class1Acronym: accronym);
      final ClassesModel classInfo = ClassesModel.fromJson(jsonDecode(result));
      // assert
      assert(classInfo.participants.length > 0);
      assert(classInfo.acronym != null && classInfo.acronym.isNotEmpty);
      assert(
          classInfo.instructorId != null && classInfo.instructorId.isNotEmpty);
      assert(classInfo.courseId != null && classInfo.courseId.isNotEmpty);
    });
  });
}
