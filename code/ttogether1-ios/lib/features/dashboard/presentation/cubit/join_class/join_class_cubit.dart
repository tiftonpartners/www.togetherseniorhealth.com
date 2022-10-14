import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/constants/router_path.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/core/network/network_info.dart';
import 'package:tsh/core/services/navigation_service.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';
import 'package:tsh/features/dashboard/domain/entities/agora.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/call_parameters.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_agora_token_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_jwt_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_secured_agora_token_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_forcetime_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_user_info_usecase.dart';

part 'join_class_state.dart';

class JoinClassCubit extends Cubit<JoinClassState> {
  final GetUserInfoUsecase getUserInfoUsecase;
  final CreateJwtAndSaveUsecase createJwtUsecase;
  final CreateAgoraTokenUsecase createAgoraAdhocTokenUsecase;
  final CreateSecuredAgoraTokenUsecase createSecuredAgoraTokenUsecase;
  final GetForceTimeUsecase getForceTimeUsecase;
  final NavigationService navigationService;
  final SharedPreferencesService sharedPreferencesService;
  TshUser myUserInfo;
  TshUser instructorInfo;
  List<TshUser> participantsList = [];
  bool isInstructor;
  ClassesModel classesModel;

  final NetworkInfo networkInfo;
  StreamSubscription networkSubscription;
  JoinClassCubit({
    @required this.networkInfo,
    @required this.getUserInfoUsecase,
    @required this.createJwtUsecase,
    @required this.createAgoraAdhocTokenUsecase,
    @required this.createSecuredAgoraTokenUsecase,
    @required this.navigationService,
    @required this.getForceTimeUsecase,
    @required this.sharedPreferencesService,
  }) : super(JoinClassInitial());

  void onCreateAgoraTokenOrEnterClass(
      {@required String acronym,
      @required String startDate,
      ClassesModel classInfo,
      bool isCheck,
      bool isAdhoc = false,
      bool isEnterClass = false}) async {
    emit(JoinClassInitial());
    emit(JoinClassLoading());
    bool isConnected = await _isConnected();
    if (!isConnected) {
      return emit(JoinClassError(failure: ServerFailure(Label.NO_INTERNET)));
    } else {
      var agoraToken;
      if (isAdhoc) {
        agoraToken = await createAgoraAdhocTokenUsecase(acronym);
      } else {
        agoraToken = await createSecuredAgoraTokenUsecase(acronym);
      }

      agoraToken.fold(
        (error) => emit(JoinClassError(failure: error)),
        (agora) {
          if (isEnterClass) {
            if (isAdhoc) {
              (agora as AgoraModel).session = classesModel.sessions.first;
            }
            navigationService.pushAndRemoveUntil(RoutePath.CALL,
                params: CallParameters(
                    agora: agora,
                    myUserInfo: myUserInfo,
                    instructorInfo: instructorInfo,
                    participantsList: participantsList,
                    classesModel: classesModel,
                    isCheck: isCheck,
                    isInstructor: isInstructor));
          }
          emit(JoinClassLoaded(agora: agora));
        },
      );
    }
  }

  void onOpenDeeplink(
      {@required String ticket,
      String forceTime,
      bool fromHome = false}) async {
    emit(JoinClassInitial());
    emit(OpenDeepLinkLoading());
    bool isConnected = await _isConnected();
    if (!isConnected) {
      return emit(JoinClassError(failure: ServerFailure(Label.NO_INTERNET)));
    } else {
      final jwt = await createJwtUsecase(ticket, forceTime: forceTime);
      jwt.fold((error) => emit(JoinClassError(failure: error)), (jwt) async {
        final getUserInfo = await getUserInfoUsecase("me", isId: false);
        getUserInfo.fold((error) => emit(JoinClassError(failure: error)),
            (userInfo) async {
          TshUserModel user = userInfo;
          await sharedPreferencesService.setUserInfo(user.toJson());
          navigationService.pushAndRemoveUntil(RoutePath.HOME,
              params: userInfo);
        });
      });
    }
  }

  String getForceTime() => getForceTimeUsecase();

  void onClear() {
    emit(JoinClassInitial());
  }

  void onJoin({String acronym, Agora agora}) {
    navigationService.navigateTo(RoutePath.CALL,
        params: CallParameters(agora: agora));
  }

  Future<bool> _isConnected() async {
    return await networkInfo.isConnected;
  }

  @override
  Future<void> close() {
    networkSubscription?.cancel();
    return super.close();
  }
}
