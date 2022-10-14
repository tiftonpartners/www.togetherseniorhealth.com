part of 'get_user_info_cubit.dart';

abstract class GetUserInfoState extends Equatable {
  const GetUserInfoState();

  @override
  List<Object> get props => [];
}

class GetUserInfoInitial extends GetUserInfoState {}

class GetUserInfoLoading extends GetUserInfoState {}

class GetUserInfoLoaded extends GetUserInfoState {
  final TshUser userInfo;
  final TshUser instructor;
  final List<TshUser> participants;
  final ClassesModel classesModel;
  final bool isInstructor;
  final bool isCheck;
  GetUserInfoLoaded({
    @required this.userInfo,
    @required this.classesModel,
    @required this.participants,
    @required this.isInstructor,
    @required this.instructor,
    @required this.isCheck,
  });
  @override
  List<Object> get props => [userInfo];
}

class GetUserInfoError extends GetUserInfoState {
  final Failure failure;
  GetUserInfoError({@required this.failure});
  @override
  List<Object> get props => [failure];
}
