// ignore: unused_import
import 'package:agora_rtc_engine/rtc_engine.dart';
import 'package:data_connection_checker/data_connection_checker.dart';
import 'package:get_it/get_it.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tsh/features/auth/presentation/cubit/cubit/auth_cubit.dart';
import 'package:tsh/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:tsh/features/dashboard/data/repositories/auth_repository_impl.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_agora_token_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_jwt_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_secured_agora_token_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_class_info_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_user_info_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/upcoming_adhoc_class_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/upcoming_classes_usecase.dart';
import 'package:tsh/features/dashboard/presentation/cubit/deep_link/deep_link_cubit.dart';
import 'package:tsh/features/dashboard/presentation/cubit/get_user_info/get_user_info_cubit.dart';
import 'package:tsh/features/dashboard/presentation/cubit/join_class/join_class_cubit.dart';

import 'core/cubit/error_dialog/error_dialog_cubit.dart';
import 'core/network/network_call.dart';
import 'core/network/network_info.dart';
import 'core/services/auth0_service.dart';
import 'core/services/global_event_service.dart';
import 'core/services/navigation_service.dart';
import 'core/services/share_preferences_service.dart';
import 'core/util/input_converter.dart';
import 'features/dashboard/domain/entities/agora.dart';
import 'features/dashboard/domain/entities/parameters/call_parameters.dart';
import 'features/dashboard/domain/usecases/get_forcetime_usecase.dart';
import 'features/dashboard/presentation/cubit/calling/calling_cubit.dart';
import 'features/dashboard/presentation/cubit/upcoming_class/upcoming_classes_cubit.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // final engine = await RtcEngine.create(Constants.APP_ID);

  // cubit
  sl.registerFactory(() => AuthCubit(
        auth0service: sl(),
        navigationService: sl(),
        sharedPreferencesService: sl(),
      ));
  sl.registerFactory(
    () => UpcomingClassesCubit(
      upcomingClassesUsecase: sl(),
      networkInfo: sl(),
      upcomingAdhocClassUsecase: sl(),
      sharedPreferencesService: sl(),
      inputConverter: sl(),
    ),
  );
  sl.registerFactoryParam((CallParameters callParameters, p2) => CallingCubit(
      sharedPreferencesService: sl(),
      networkInfo: sl(),
      getUserInfoUsecase: sl(),
      getClassInfoUsecase: sl(),
      navigationService: sl(),
      globalEventService: sl<GlobalEventService>(
        param1: callParameters.agora,
      ),
      callParameters: callParameters));
  sl.registerFactory(() => DialogCubit());
  sl.registerLazySingleton(() => DeepLinkCubit(
        auth0service: sl(),
      ));
  sl.registerFactory(() => JoinClassCubit(
        getUserInfoUsecase: sl(),
        networkInfo: sl(),
        createAgoraAdhocTokenUsecase: sl(),
        createSecuredAgoraTokenUsecase: sl(),
        createJwtUsecase: sl(),
        getForceTimeUsecase: sl(),
        navigationService: sl(),
        sharedPreferencesService: sl(),
      ));
  sl.registerFactory(() => GetUserInfoCubit(
        getUserInfoUsecase: sl(),
        sharedPreferencesService: sl(),
      ));

  // Use cases
  sl.registerLazySingleton(() => UpcomingAdhocClassUsecase(sl()));
  sl.registerLazySingleton(() => GetUserInfoUsecase(sl()));
  sl.registerLazySingleton(() => GetClassInfoUsecase(sl()));
  sl.registerLazySingleton(() => UpcomingClassesUsecase(sl()));
  sl.registerLazySingleton(() => CreateAgoraTokenUsecase(sl()));
  sl.registerLazySingleton(() => CreateSecuredAgoraTokenUsecase(sl()));
  sl.registerLazySingleton(() => GetForceTimeUsecase(sl()));
  sl.registerLazySingleton(() => CreateJwtAndSaveUsecase(sl()));

  // Repository
  sl.registerLazySingleton<DashboardRepository>(
    () => DashboardRepositoryImpl(dashboardRemoteDataSource: sl()),
  );

  // Data sources
  sl.registerLazySingleton<DashboardRemoteDataSource>(
    () => DashboardRemoteDataSourceImpl(
      networkCall: sl(),
      sharedPreferencesService: sl(),
    ),
  );

//! Core
  sl.registerLazySingleton(() => InputConverter());
  sl.registerLazySingleton(() => GlobalFunctions());
  sl.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl(sl()));

  //! External
  final sharedPreferences = await SharedPreferences.getInstance();

  sl.registerLazySingleton(() => sharedPreferences);
  sl.registerLazySingleton(() => http.Client());
  sl.registerLazySingleton(() => DataConnectionChecker());
  sl.registerLazySingleton(
    () => NetworkCall(
      client: sl(),
      preference: sl(),
    ),
  );

  //services
  sl.registerLazySingleton<SharedPreferencesService>(
      () => SharedPreferencesService(preferences: sl()));
  sl.registerFactoryParam(
    (Agora agoraCon, param) => GlobalEventService(
      agoraCon,
    ),
  );

  sl.registerLazySingleton<NavigationService>(() => NavigationService());
  sl.registerLazySingleton<Auth0Service>(() => Auth0Service(
        sharedPreferencesService: sl(),
      ));
}
