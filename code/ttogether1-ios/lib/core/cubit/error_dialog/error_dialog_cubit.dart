import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';
import 'package:tsh/core/error/failures.dart';

part 'error_dialog_state.dart';

class DialogCubit extends Cubit<DialogState> {
  DialogCubit() : super(DialogInitial());
  void showErrorDialog(Failure failure) {
    emit(DialogInitial());
    emit(DialogError(failure: failure));
  }
}
