// ignore: unused_import
import 'package:agora_rtc_engine/rtc_engine.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:http/testing.dart';
import 'package:mockito/mockito.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tsh/core/cubit/error_dialog/error_dialog_cubit.dart';
import 'package:tsh/core/network/network_call.dart';
import 'package:tsh/core/services/auth0_service.dart';
import 'package:tsh/core/services/global_event_service.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/auth/presentation/cubit/cubit/auth_cubit.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_forcetime_usecase.dart';
import 'package:tsh/features/dashboard/presentation/cubit/calling/calling_cubit.dart';
import 'package:tsh/features/dashboard/presentation/cubit/upcoming_class/upcoming_classes_cubit.dart';
import 'package:tsh/injection_container.dart';
import 'package:tsh/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_agora_token_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_jwt_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_secured_agora_token_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_class_info_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_user_info_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/upcoming_adhoc_class_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/upcoming_classes_usecase.dart';
import 'package:tsh/features/dashboard/presentation/cubit/get_user_info/get_user_info_cubit.dart';
import 'package:tsh/features/dashboard/presentation/cubit/join_class/join_class_cubit.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences_platform_interface/shared_preferences_platform_interface.dart';

class MockHttpClient extends Mock implements http.Client {}

class MockSharedPreferencesService extends Mock
    implements SharedPreferencesService {}

class MockSharedPreferences extends Mock implements SharedPreferences {}

class FakeSharedPreferencesStore implements SharedPreferencesStorePlatform {
  FakeSharedPreferencesStore(Map<String, Object> data)
      : backend = InMemorySharedPreferencesStore.withData(data);

  final InMemorySharedPreferencesStore backend;
  final List<MethodCall> log = <MethodCall>[];

  @override
  bool get isMock => true;

  @override
  Future<bool> clear() {
    log.add(MethodCall('clear'));
    return backend.clear();
  }

  @override
  Future<Map<String, Object>> getAll() {
    log.add(MethodCall('getAll'));
    return backend.getAll();
  }

  @override
  Future<bool> remove(String key) {
    log.add(MethodCall('remove', key));
    return backend.remove(key);
  }

  @override
  Future<bool> setValue(String valueType, String key, Object value) {
    log.add(MethodCall('setValue', <dynamic>[valueType, key, value]));
    return backend.setValue(valueType, key, value);
  }
}

main() {
  FakeSharedPreferencesStore store;

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

  //   const channel = MethodChannel('agora_rtc_engine');

  // TestWidgetsFlutterBinding.ensureInitialized();

  // setUp(() async {
  //   channel.setMockMethodCallHandler((MethodCall methodCall) async {
  //     print("methodCall $methodCall");
  //     return '42';
  //   });

  test('test init function in injector / DI', () async {
    final getIt = GetIt.instance;

    sl.registerLazySingleton(() => MockClient);

    expect(getIt.isRegistered<AuthCubit>(), true);
    expect(getIt.isRegistered<UpcomingClassesCubit>(), true);
    expect(getIt.isRegistered<CallingCubit>(), true);
    expect(getIt.isRegistered<DialogCubit>(), true);
    expect(getIt.isRegistered<JoinClassCubit>(), true);
    expect(getIt.isRegistered<JoinClassCubit>(), true);
    expect(getIt.isRegistered<UpcomingAdhocClassUsecase>(), true);

    expect(getIt.isRegistered<GetUserInfoUsecase>(), true);
    expect(getIt.isRegistered<GetClassInfoUsecase>(), true);
    expect(getIt.isRegistered<UpcomingClassesUsecase>(), true);
    expect(getIt.isRegistered<CreateAgoraTokenUsecase>(), true);
    expect(getIt.isRegistered<CreateSecuredAgoraTokenUsecase>(), true);
    expect(getIt.isRegistered<GetForceTimeUsecase>(), true);
    expect(getIt.isRegistered<CreateJwtAndSaveUsecase>(), true);

    expect(getIt.isRegistered<DashboardRepository>(), true);
    // expect(getIt.isRegistered<DashboardRepository>(), true);
    expect(getIt.isRegistered<DashboardRemoteDataSource>(), true);
    // expect(getIt.isRegistered<DashboardRemoteDataSourceImpl>(), true);
    expect(getIt.isRegistered<SharedPreferencesService>(), true);
    expect(getIt.isRegistered<GlobalEventService>(), true);
    expect(getIt.isRegistered<NetworkCall>(), true);
  });
  group("Test initializing objects", () {
    test("Should all the properties of NetworkCall set", () {
      NetworkCall networkCall = sl<NetworkCall>();

      expect(networkCall.preference, isNotNull);
    });
    test("Should all the properties of JoinClassCubit set", () {
      JoinClassCubit joinClassCubit = sl<JoinClassCubit>();

      expect(joinClassCubit.getUserInfoUsecase, isNotNull);
      expect(joinClassCubit.networkInfo, isNotNull);
      expect(joinClassCubit.createAgoraAdhocTokenUsecase, isNotNull);
      expect(joinClassCubit.createSecuredAgoraTokenUsecase, isNotNull);
      expect(joinClassCubit.createJwtUsecase, isNotNull);
      expect(joinClassCubit.getForceTimeUsecase, isNotNull);
      expect(joinClassCubit.navigationService, isNotNull);
      expect(joinClassCubit.sharedPreferencesService, isNotNull);
    });
    test("Should all the properties of GetUserInfoCubit set", () {
      GetUserInfoCubit getUserInfoCubit = sl<GetUserInfoCubit>();

      expect(getUserInfoCubit.getUserInfoUsecase, isNotNull);
      expect(getUserInfoCubit.sharedPreferencesService, isNotNull);
    });
    // TODO: to come back later as appsflyer is complaining
    // test("Should all the properties of DeepLinkCubit set", () {
    //   DeepLinkCubit deepLinkCubit = sl<DeepLinkCubit>();

    //   expect(deepLinkCubit.auth0service, isNotNull);
    // });
    test("Should all the properties of UpcomingClassesCubit set", () {
      UpcomingClassesCubit upcomingClassesCubit = sl<UpcomingClassesCubit>();

      expect(upcomingClassesCubit.upcomingClassesUsecase, isNotNull);
      expect(upcomingClassesCubit.networkInfo, isNotNull);
      expect(upcomingClassesCubit.upcomingAdhocClassUsecase, isNotNull);
      expect(upcomingClassesCubit.sharedPreferencesService, isNotNull);
      expect(upcomingClassesCubit.inputConverter, isNotNull);
    });
    test("Should all the properties of AuthCubit set", () {
      AuthCubit authCubit = sl<AuthCubit>();

      expect(authCubit.auth0service, isNotNull);
      expect(authCubit.navigationService, isNotNull);
      expect(authCubit.sharedPreferencesService, isNotNull);
    });
    test("Should all the properties of Auth0Service set", () {
      Auth0Service auth0Service = sl<Auth0Service>();

      expect(auth0Service.sharedPreferencesService, isNotNull);
    });
  });
}
