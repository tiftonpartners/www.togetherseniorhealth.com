part of 'error_dialog_cubit.dart';


abstract class DialogState extends Equatable {
  const DialogState();

  @override
  List<Object> get props => [];
}

class DialogInitial extends DialogState {}

class DialogError extends DialogState {
  final Failure failure;

  DialogError({@required this.failure});

  @override
  List<Object> get props => [failure];
}
