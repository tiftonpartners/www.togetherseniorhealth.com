import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:tsh/constants/router_path.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/core/services/auth0_service.dart';
import 'package:tsh/core/services/navigation_service.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
part 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  final Auth0Service auth0service;
  final NavigationService navigationService;
  final SharedPreferencesService sharedPreferencesService;
  TshUser user;
  AuthCubit({
    @required this.navigationService,
    @required this.auth0service,
    @required this.sharedPreferencesService,
  }) : super(AuthInitial());

  // onAuth(bool isLogin) async {
  //   emit(AuthLoading());
  //   try {
  //     isLogin ? await auth0service.loginAction() : auth0service.logoutAction();
  //     emit(AuthLoaded());
  //   } catch (e) {
  //     emit(AuthError(failure: e));
  //   }
  // }

  onUserInfo() {
    emit(AuthInitial());
    user = sharedPreferencesService.userInfo;
    emit(AuthLoaded());
  }

  onLogout() {
    auth0service.logoutAction();
    navigationService.pushAndRemoveUntil(RoutePath.ROOT);
  }
}
