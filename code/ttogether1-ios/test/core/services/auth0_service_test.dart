import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:tsh/core/services/auth0_service.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_platform_interface.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/injection_container.dart';
import '../../injection_container_test.dart';

main() {
  Auth0Service auth0Service;
  FakeSharedPreferencesStore store;
  final sampleBearerToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL210MS1hcGkudGVzdC50c2guY2FyZSIsInN1YiI6ImF1dGgwfDYwNDk2MDE0ODE0NTQyMDA3MDliNDgxNyIsInhpZCI6IiIsImF1ZCI6Imh0dHBzOi8vbXQxLWFwaS50ZXN0LnRzaC5jYXJlIiwiaWF0IjoxNjEzNDMzODg3LCJleHAiOjg2NDAwMDAwMDAwMDAsImF6cCI6InZJeEtQS09LdG16bUgybEFLSllwVDcxNk1rcTJCcVVjIiwiZ3R5IjoicHdkbGVzcyIsInJvbGUiOiJwd2RsZXNzUGFydGljaXBhbnQiLCJ0dHkiOiJ1c2VyIiwiY2xzIjoiLSIsInBlcm1pc3Npb25zIjpbImdldDpjbGFzcyIsImdldDpjb3Vyc2UiLCJnZXQ6c2Vzc2lvbiIsImdldDp0aWNrZXQiLCJnZXQ6dXNlciIsInF1ZXJ5TWU6c2Vzc2lvbiIsInF1ZXJ5TWU6dXBjb21pbmdDbGFzcyIsInF1ZXJ5TWU6dXBjb21pbmdTZXNzaW9uIl0sImh0dHBzOi8vdDEudHNoLmNvbS9uaWNrbmFtZSI6InNlcnZlcjEtMSIsImh0dHBzOi8vdDEudHNoLmNvbS9uYW1lIjoiU2VydmVyIDEsIFN0cmVhbSAxIiwiaHR0cHM6Ly90MS50c2guY29tL3BpY3R1cmUiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci8wNWU1MjI3Njc0OGM5OWVhMjM0ZWM0MjVkYzBlZGExYj9zPTQ4MCZyPXBnJmQ9aHR0cHMlM0ElMkYlMkZjZG4uYXV0aDAuY29tJTJGYXZhdGFycyUyRnNlLnBuZyJ9.Pjr6FjYNhUFPQqzWJBJdmGIz_hogic00skkRM1460wAEI5_vxVph2Cqy41pvNBNXrQNH7kNL59sQdT38YSybtw";
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
  });

  setUp(() {
    auth0Service = Auth0Service(sharedPreferencesService: sl());
    // Set a dummy bearer token inside the shared preferences
    sl<SharedPreferencesService>().setBearerToken(sampleBearerToken);
  });

  test("Should reset shared preferences", () {
    final oldBearerToken = sl<SharedPreferencesService>().bearerToken;
    expect(oldBearerToken, isNotNull);
    auth0Service.logoutAction();
    final newBearerToken = sl<SharedPreferencesService>().bearerToken;
    expect(newBearerToken, isNull);
    // expect(actual, matcher)
  });
}
