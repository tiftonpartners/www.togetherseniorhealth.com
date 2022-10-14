part of 'join_class_cubit.dart';

abstract class JoinClassState extends Equatable {
  const JoinClassState();

  @override
  List<Object> get props => [];
}

class JoinClassInitial extends JoinClassState {}

class JoinClassLoading extends JoinClassState {}
class OpenDeepLinkLoading extends JoinClassState {}

class JoinClassLoaded extends JoinClassState {
  final Agora agora;
  JoinClassLoaded({@required this.agora});
  @override
  List<Object> get props => [agora];
}

class JoinClassError extends JoinClassState {
  final Failure failure;
  JoinClassError({@required this.failure});
  @override
  List<Object> get props => [failure];
}
