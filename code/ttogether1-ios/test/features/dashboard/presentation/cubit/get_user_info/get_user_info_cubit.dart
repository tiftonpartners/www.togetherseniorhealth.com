import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/cupertino.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_user_info_usecase.dart';

part 'get_user_info_state.dart';

class GetUserInfoCubit extends Cubit<GetUserInfoState> {
  final GetUserInfoUsecase getUserInfoUsecase;
  final SharedPreferencesService sharedPreferencesService;

  GetUserInfoCubit(
      {@required this.getUserInfoUsecase,
      @required this.sharedPreferencesService})
      : super(GetUserInfoInitial());

  Future<void> onGetMyInfo(
    ClassesModel classesModel, {
    bool isCheck = true,
  }) async {
    emit(GetUserInfoInitial());
    emit(GetUserInfoLoading());
    TshUser myUserInfo;
    TshUser instructorInfo;
    List<TshUser> participantsInfo = [];
    bool isInstructor;
    final getUserInfo = await getUserInfoUsecase("me", isId: false);

    getUserInfo.fold((error) => emit(GetUserInfoError(failure: error)),
        (userInfo) {
      myUserInfo = userInfo;
    });
    isInstructor =
        classesModel.instructorId == myUserInfo.userInfo.userData.userId;
    // if you are instructor participants gonna be 8, if not 7
    List<String> filtered = classesModel.participants
        .where((item) => item != myUserInfo.userInfo.userData.userId)
        .toList();
    if (!isInstructor) {
      final getInstructorInfo =
          await getUserInfoUsecase(classesModel.instructorId, isId: true);

      getInstructorInfo.fold(
        (error) => emit(GetUserInfoError(failure: error)),
        (userInfo) {
          instructorInfo = userInfo;
        },
      );
    }

    await Future.forEach(filtered, (element) async {
      final getUserInfo = await getUserInfoUsecase(element, isId: true);
      getUserInfo.fold((error) => emit(GetUserInfoError(failure: error)),
          (userInfo) {
        participantsInfo.add(userInfo);
      });
    });
    emit(
      GetUserInfoLoaded(
          userInfo: myUserInfo,
          participants: participantsInfo,
          instructor: isInstructor ? myUserInfo : instructorInfo,
          isInstructor: isInstructor,
          isCheck: isCheck,
          classesModel: classesModel),
    );
  }
}
