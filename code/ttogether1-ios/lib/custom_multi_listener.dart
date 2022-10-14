import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:tsh/core/services/navigation_service.dart';
import 'package:tsh/core/util/input_converter.dart';
import 'constants/labels.dart';
import 'core/cubit/error_dialog/error_dialog_cubit.dart';
import 'core/error/failures.dart';
import 'features/dashboard/presentation/cubit/deep_link/deep_link_cubit.dart';
import 'features/dashboard/presentation/cubit/get_user_info/get_user_info_cubit.dart';
import 'features/dashboard/presentation/cubit/join_class/join_class_cubit.dart';
import 'injection_container.dart';

class CustomMultiListener extends StatelessWidget {
  final Widget child;
  const CustomMultiListener({
    Key key,
    @required this.child,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<DeepLinkCubit, DeepLinkState>(
          listener: (context, state) {
            sl<GlobalFunctions>().manageState(
              context,
              state,
              isLoadingState: state is DeepLinkLoading,
              isErrorState: state is DeepLinkError,
              onOtherState: () {
                if (state is DeepLinkLoaded) {
                  context.read<JoinClassCubit>().onOpenDeeplink(
                      ticket: state.ticket, forceTime: state.forceTime);
                }
              },
            );
          },
        ),
        BlocListener<GetUserInfoCubit, GetUserInfoState>(
          listener: (context, state) {
            sl<GlobalFunctions>().manageState(
              context,
              state,
              isLoadingState: state is GetUserInfoLoading,
              isErrorState: state is GetUserInfoError,
              isDismiss: false,
              onOtherState: () {
                if (state is GetUserInfoLoaded) {
                  context.read<JoinClassCubit>().myUserInfo = state.userInfo;
                  context.read<JoinClassCubit>().classesModel =
                      state.classesModel;
                  context.read<JoinClassCubit>().isInstructor =
                      state.isInstructor;
                  context.read<JoinClassCubit>().instructorInfo =
                      state.isInstructor ? state.userInfo : state.instructor;
                  context.read<JoinClassCubit>().participantsList =
                      state.isInstructor
                          ? state.participants
                          : [state.userInfo, ...state.participants];

                  context.read<JoinClassCubit>().onCreateAgoraTokenOrEnterClass(
                      acronym: state.classesModel.sessions.first.acronym,
                      startDate: state.classesModel.startDate0Z,
                      isCheck: state.isCheck,
                      isAdhoc:
                          state.classesModel.sessions.first.sT == "ClassSession"
                              ? false
                              : true,
                      isEnterClass: true);
                }
              },
            );
          },
        ),
        BlocListener<JoinClassCubit, JoinClassState>(
          listener: (context, state) {
            sl<GlobalFunctions>().manageState(
              context,
              state,
              isErrorState: state is JoinClassError,
              isLoadingState: state is JoinClassLoading
                  ? false
                  : state is OpenDeepLinkLoading
                      ? true
                      : false,
            );
          },
        ),
        BlocListener<DialogCubit, DialogState>(
          listener: (_, state) {
            BuildContext currentContext =
                sl<NavigationService>().navigatorKey.currentContext;
            if (state is DialogError) {
              final failure = state.failure;
              String message;
              if (failure is CacheFailure) {
                message = failure.messsage;
              } else if (failure is ServerFailure) {
                message = failure.messsage;
              }

              if (message
                      .toLowerCase()
                      .contains(("Failed host").toLowerCase()) ==
                  true) {
                message =
                    "Please check your internet connection";
              }
              AwesomeDialog(
                context: currentContext,
                keyboardAware: true,
                dismissOnBackKeyPress: false,
                dialogType: DialogType.ERROR,
                animType: AnimType.BOTTOMSLIDE,
                isDense: true,
                width: MediaQuery.of(currentContext).size.width * .5,
                btnCancelText: Label.TRY_AGAIN,
                title: Label.ERROR,
                padding: const EdgeInsets.all(16.0),
                desc: message,
                btnCancelOnPress: () {},
              )..show();
            }
          },
        ),
      ],
      child: child,
    );
  }
}
