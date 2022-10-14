import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_platform_interface.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/injection_container.dart';
import '../../fixtures/fixture_reader.dart';
import '../../injection_container_test.dart'; // <-- needed for `MethodChannel`

main() {
  SharedPreferencesService sharedPreferencesService;
  FakeSharedPreferencesStore store;
  final sampleBearerToken =
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL210MS1hcGkudGVzdC50c2guY2FyZSIsInN1YiI6ImF1dGgwfDYwNDk2MDE0ODE0NTQyMDA3MDliNDgxNyIsInhpZCI6IiIsImF1ZCI6Imh0dHBzOi8vbXQxLWFwaS50ZXN0LnRzaC5jYXJlIiwiaWF0IjoxNjEzNDMzODg3LCJleHAiOjg2NDAwMDAwMDAwMDAsImF6cCI6InZJeEtQS09LdG16bUgybEFLSllwVDcxNk1rcTJCcVVjIiwiZ3R5IjoicHdkbGVzcyIsInJvbGUiOiJwd2RsZXNzUGFydGljaXBhbnQiLCJ0dHkiOiJ1c2VyIiwiY2xzIjoiLSIsInBlcm1pc3Npb25zIjpbImdldDpjbGFzcyIsImdldDpjb3Vyc2UiLCJnZXQ6c2Vzc2lvbiIsImdldDp0aWNrZXQiLCJnZXQ6dXNlciIsInF1ZXJ5TWU6c2Vzc2lvbiIsInF1ZXJ5TWU6dXBjb21pbmdDbGFzcyIsInF1ZXJ5TWU6dXBjb21pbmdTZXNzaW9uIl0sImh0dHBzOi8vdDEudHNoLmNvbS9uaWNrbmFtZSI6InNlcnZlcjEtMSIsImh0dHBzOi8vdDEudHNoLmNvbS9uYW1lIjoiU2VydmVyIDEsIFN0cmVhbSAxIiwiaHR0cHM6Ly90MS50c2guY29tL3BpY3R1cmUiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci8wNWU1MjI3Njc0OGM5OWVhMjM0ZWM0MjVkYzBlZGExYj9zPTQ4MCZyPXBnJmQ9aHR0cHMlM0ElMkYlMkZjZG4uYXV0aDAuY29tJTJGYXZhdGFycyUyRnNlLnBuZyJ9.Pjr6FjYNhUFPQqzWJBJdmGIz_hogic00skkRM1460wAEI5_vxVph2Cqy41pvNBNXrQNH7kNL59sQdT38YSybtw";
  const Map<String, dynamic> kTestValues = <String, dynamic>{
    'flutter.String': 'hello world',
    'flutter.bool': true,
    'flutter.int': 42,
    'flutter.double': 3.14159,
    'flutter.List': <String>['foo', 'bar'],
  };

  setUp(() async {
    store = FakeSharedPreferencesStore(kTestValues);
    SharedPreferencesStorePlatform.instance = store;

    //make sure the instance is cleared before each test
    await GetIt.I.reset();
    store.log.clear();

    await init();

    sharedPreferencesService = sl<SharedPreferencesService>();
  });

  group("Test preferences properties setter / getter", () {
    final userToken = "userToken1234";
    final bearerToken = "ezxqw430w89u4qwu0i8iwaqjioajdsaodsjidoijasoaidoijsad";
    final currentTime = "2021-12-01T19:00:00.000Z";
    final forceTime = "2021-12-10T19:00:00.000Z";

    test("Should set the refresh token", () async {
      await sharedPreferencesService.setUserToken(userToken);
      expect(sharedPreferencesService.userToken, userToken);
    });
    test("Should set the current time", () async {
      await sharedPreferencesService.setCurrentTime(currentTime);
      expect(sharedPreferencesService.currentTime, currentTime);
    });
    test("Should set the bearer token", () async {
      await sharedPreferencesService.setBearerToken(bearerToken);
      expect(sharedPreferencesService.bearerToken, bearerToken);
    });
    test("Should set the forced time", () async {
      await sharedPreferencesService.setForceTime(forceTime);
      expect(sharedPreferencesService.forceTime, forceTime);
    });
    test("Should set the forced time", () async {
      await sharedPreferencesService.setForceTime(forceTime);
      expect(sharedPreferencesService.forceTime, forceTime);
    });

    test("Should reset all properties", () async {
      await sharedPreferencesService.reset();
      expect(sharedPreferencesService.bearerToken, null);
      expect(sharedPreferencesService.forceTime, null);
      expect(sharedPreferencesService.currentTime, null);
    });

    test("Should set the user token", () async {
      final userToken = "someToken";
      await sharedPreferencesService.setUserToken(userToken);
      expect(sharedPreferencesService.userToken, equals(userToken));
    });

    test("Should set the whole user information", () async {
      final Map<String, dynamic> userinfoMap =
          json.decode(fixture('userinfo.json'));
      final userinfo = TshUserModel.fromJson(userinfoMap);
      await sharedPreferencesService.setUserInfo(userinfoMap);
      expect(sharedPreferencesService.userInfo.userInfo.userNumber,
          equals(userinfo.userInfo.userNumber));
      expect(sharedPreferencesService.userInfo.userInfo.userDataLastSet,
          equals(userinfo.userInfo.userDataLastSet));
    });

    test("Should get / set a generic item", () async {
      final someValue = "someValue";
      final anotherValue = "anotherValue";
      final someKey = "someKey";
      await sharedPreferencesService.setItem(someKey, someValue);
      expect(sharedPreferencesService.getItem(someKey), equals(someValue));
      await sharedPreferencesService.setItem(someKey, anotherValue);
      expect(sharedPreferencesService.getItem(someKey), equals(anotherValue));
    });
  });
}
