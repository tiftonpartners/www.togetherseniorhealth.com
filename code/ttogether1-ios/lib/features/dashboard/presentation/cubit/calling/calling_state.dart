part of 'calling_cubit.dart';

abstract class CallingState extends Equatable {
  const CallingState();

  @override
  List<Object> get props => [];
}

class CallingInitial extends CallingState {}

class CallingLoading extends CallingState {}

class CallingLoaded extends CallingState {}

class CallingError extends CallingState {
  final Failure failure;
  CallingError({@required this.failure});
  @override
  List<Object> get props => [failure];
}
