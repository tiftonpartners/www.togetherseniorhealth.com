part of 'upcoming_classes_cubit.dart';

abstract class UpcomingClassesState extends Equatable {
  const UpcomingClassesState();

  @override
  List<Object> get props => [];
}

class UpcomingClassesInitial extends UpcomingClassesState {}

class UpcomingClassesLoading extends UpcomingClassesState {}

class UpcomingClassesLoaded extends UpcomingClassesState {}

class UpcomingClassesError extends UpcomingClassesState {
  final Failure failure;
  UpcomingClassesError({@required this.failure});
  @override
  List<Object> get props => [failure];
}
