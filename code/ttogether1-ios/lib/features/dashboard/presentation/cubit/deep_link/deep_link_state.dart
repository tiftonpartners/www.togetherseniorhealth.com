part of 'deep_link_cubit.dart';

abstract class DeepLinkState extends Equatable {
  const DeepLinkState();

  @override
  List<Object> get props => [];
}

class DeepLinkInitial extends DeepLinkState {}

class DeepLinkLoading extends DeepLinkState {}

class DeepLinkLoaded extends DeepLinkState {
  final String ticket;
  final String forceTime;

  DeepLinkLoaded(this.ticket, {this.forceTime});

  @override
  List<Object> get props => [ticket, forceTime];
}

class DeepLinkEmpty extends DeepLinkState {}

class DeepLinkError extends DeepLinkState {
  final Failure failure;
  DeepLinkError({@required this.failure});
  @override
  List<Object> get props => [failure];
}
