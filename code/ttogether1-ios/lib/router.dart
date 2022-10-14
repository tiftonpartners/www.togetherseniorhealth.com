import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/auth/presentation/pages/authentication_page.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/call_parameters.dart';
import 'package:tsh/features/dashboard/presentation/pages/HomePage.dart';

import 'constants/router_path.dart';
import 'core/services/global_event_service.dart';
import 'features/auth/presentation/cubit/cubit/auth_cubit.dart';
import 'features/dashboard/presentation/cubit/calling/calling_cubit.dart';
import 'features/dashboard/presentation/cubit/upcoming_class/upcoming_classes_cubit.dart';
import 'features/dashboard/presentation/pages/CallPage.dart';
import 'injection_container.dart';

Route<dynamic> generateRoute(RouteSettings settings) {
  switch (settings.name) {
    case RoutePath.ROOT:
      return sl<SharedPreferencesService>().bearerToken != null
          ? MaterialPageRoute(
              builder: (context) => MultiBlocProvider(
                    providers: [
                      BlocProvider(
                        create: (context) => sl<AuthCubit>()..onUserInfo(),
                      ),
                      BlocProvider(
                        create: (context) => sl<UpcomingClassesCubit>()
                          ..onUpcomingClass(
                              forceTime:
                                  sl<SharedPreferencesService>().forceTime),
                      ),
                    ],
                    child: HomePage(),
                  ))
          : MaterialPageRoute(
              builder: (context) => BlocProvider(
                  create: (context) => sl<AuthCubit>(),
                  child: AuthicationPage()));
    case RoutePath.HOME:
      return MaterialPageRoute(
        builder: (context) => MultiBlocProvider(
          providers: [
            BlocProvider(
              create: (context) => sl<AuthCubit>()..onUserInfo(),
            ),
            BlocProvider(
              create: (context) => sl<UpcomingClassesCubit>()
                ..onUpcomingClass(
                    forceTime: sl<SharedPreferencesService>().forceTime),
            ),
          ],
          child: HomePage(),
        ),
      );
    case RoutePath.CALL:
      CallParameters callParameters = settings.arguments as CallParameters;
      return MaterialPageRoute(
          builder: (context) => BlocProvider(
                create: (context) => sl<CallingCubit>(param1: callParameters),
                child: CallPage(),
              ));
    default:
      return MaterialPageRoute(
        builder: (context) => Container(),
      );
  }
}
