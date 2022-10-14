import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/imageLink.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/constants/style.dart';
import 'package:tsh/core/data/enum/enums.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/core/services/navigation_service.dart';
import 'package:tsh/core/util/input_converter.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/call_parameters.dart';

import 'package:tsh/features/dashboard/presentation/cubit/calling/calling_cubit.dart';
import 'package:tsh/features/dashboard/presentation/widgets/no_internet_connection.dart';
import 'package:tsh/features/dashboard/presentation/widgets/text_button_widget.dart';
import 'package:tsh/features/dashboard/presentation/widgets/toolbar_widget.dart';
import 'package:tsh/features/dashboard/presentation/widgets/video_grid_widget.dart';

import '../../../../injection_container.dart';

class CallPage extends StatefulWidget {
  final CallParameters callParameters;

  const CallPage({Key key, this.callParameters}) : super(key: key);

  @override
  _CallPageState createState() => _CallPageState();
}

class _CallPageState extends State<CallPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await Future.delayed(Duration(seconds: 2), () async {
        await context.read<CallingCubit>().getPermission();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: context.read<CallingCubit>().scaffoldKey,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end:
                Alignment(1, 0.0), // 10% of the width, so there are ten blinds.
            colors: <Color>[
              Color(0xff2d2930),
              Color(0xff4b4456),
            ], // red to yellow
            // repeats the gradient over the canvas
          ),
        ),
        child: BlocConsumer<CallingCubit, CallingState>(
          listener: (context, state) {
            sl<GlobalFunctions>().manageState(
              context,
              state,
              isLoadingState: state is CallingLoading,
              isErrorState: false,
            );
          },
          builder: (context, state) {
            bool isLanscape = MediaQuery.of(context).size.width >
                MediaQuery.of(context).size.height;
            bool groupViewMode =
                context.watch<CallingCubit>().currentView == EClientView.GROUP;
            final tshUsers = context.read<CallingCubit>().tshUserList;
            if (state is CallingLoaded) {
              return context.watch<CallingCubit>().isCheck
                  ? Stack(
                      alignment: AlignmentDirectional.center,
                      children: [
                        Positioned(
                          left: 8,
                          top: 36,
                          child: IconButton(
                            icon: Icon(
                              Icons.arrow_back_ios,
                              color: Palette.kWhite,
                            ),
                            onPressed: () {
                              context.read<CallingCubit>().onCallEnd();
                            },
                          ),
                        ),
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: MediaQuery.of(context).size.width * .7,
                              child: Text(
                                "Make sure that your whole body from head to toe is visible in the video preview.",
                                style: titleStyle.copyWith(
                                  color: Palette.kWhite,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            Container(
                              width: isLanscape
                                  ? MediaQuery.of(context).size.width * (9 / 16)
                                  : MediaQuery.of(context).size.height *
                                      (9 / 16),
                              height: isLanscape
                                  ? MediaQuery.of(context).size.height *
                                      (9 / 19)
                                  : MediaQuery.of(context).size.width *
                                      (9 / 19),
                              padding: const EdgeInsets.all(24.0),
                              child: Container(
                                decoration: BoxDecoration(boxShadow: [
                                  BoxShadow(
                                      blurRadius: 6,
                                      spreadRadius: 2,
                                      offset: Offset(0, 1),
                                      color: Colors.black38)
                                ], borderRadius: BorderRadius.circular(16)),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: Column(
                                    children: [
                                      Expanded(
                                        child: Container(
                                          child: context
                                              .watch<CallingCubit>()
                                              .localView(isLanscape),
                                          decoration: BoxDecoration(
                                            color: Palette.kVideoBackground,
                                          ),
                                        ),
                                      ),
                                      Container(
                                          alignment: Alignment.centerLeft,
                                          padding: EdgeInsets.symmetric(
                                              horizontal: 8),
                                          width: double.infinity,
                                          color: Palette.kInfoBackgroundDark,
                                          child: Row(
                                            children: [
                                              Text(
                                                context
                                                        .read<CallingCubit>()
                                                        ?.callParameters
                                                        ?.myUserInfo
                                                        ?.userInfo
                                                        ?.userData
                                                        ?.name ??
                                                    "",
                                                style: TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 16),
                                              ),
                                            ],
                                          )),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(
                              height: 24,
                            ),
                            Container(
                              width: MediaQuery.of(context).size.width *
                                  (isLanscape ? 0.3 : 0.5),
                              height: 48,
                              child: Semantics(
                                child: MaterialButton(
                                  onPressed: () async {
                                    await context
                                        .read<CallingCubit>()
                                        .checkPermission();
                                  },
                                  disabledColor: Colors.grey,
                                  height: 40,
                                  color: Palette.kButtonEnterClass,
                                  child: Text(
                                    context
                                            .read<CallingCubit>()
                                            .permissionStatus
                                        ? Label.CHECK_PERMISSION
                                        : Label.ENTER_CLASSROOM,
                                    style: TextStyle(
                                        color: Palette.kBlack, fontSize: 18),
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(
                              height: 24,
                            )
                          ],
                        ),
                        if (context.watch<CallingCubit>().isGetHelp)
                          Positioned(
                            bottom: 100,
                            right: -10,
                            child: Container(
                              width: MediaQuery.of(context).size.width * 0.38,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 20, vertical: 16),
                              decoration: BoxDecoration(
                                  color: Palette.kAskHelpPopup,
                                  border: Border.all(
                                    color: Palette.kWhite,
                                  ),
                                  borderRadius: BorderRadius.circular(8)),
                              child: RichText(
                                text: TextSpan(
                                  children: [
                                    TextSpan(
                                      text:
                                          "Please call 415-237-3040 for support. \n\n",
                                      style: titleStyle.copyWith(
                                        color: Palette.kWhite,
                                      ),
                                    ),
                                    TextSpan(
                                        text:
                                            "Hours are Monday - Friday from 9am - 5pm Pacific time.",
                                        style: TextStyle(fontSize: 20),),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        Container(
                          padding: const EdgeInsets.all(8.0),
                          child: Align(
                            alignment: Alignment.bottomRight,
                            child: TextIconButton(
                              isRow: true,
                              color:
                                  context.watch<CallingCubit>().isAskedForHelp
                                      ? Palette.kButtonCallLight
                                      : Palette.kButtonCall,
                              textColor:
                                  context.watch<CallingCubit>().isAskedForHelp
                                      ? Palette.kButtonCall
                                      : Palette.kButtonCallLight,
                              iconColor: Palette.kIconAskHelp,
                              iconUrl: ImageLink.GET_HELP,
                              text: Label.GET_HELP,
                              onTap: () async {
                                context.read<CallingCubit>().onToggleGetInfo();
                              },
                            ),
                          ),
                        )
                      ],
                    )
                  : Center(
                      child: Stack(
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(left: 10, right: 10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Spacer(),
                                Container(
                                  width: (tshUsers.length <= 4 && !isLanscape)
                                      ? (MediaQuery.of(context).size.width -
                                              150) *
                                          .66
                                      : (groupViewMode ||
                                              context
                                                      .watch<CallingCubit>()
                                                      .currentView ==
                                                  EClientView.INSTRUCTOR)
                                          ? MediaQuery.of(context).size.width -
                                              150
                                          : isLanscape
                                              ? (MediaQuery.of(context)
                                                          .size
                                                          .width -
                                                      150) *
                                                  .66
                                              : MediaQuery.of(context)
                                                      .size
                                                      .width -
                                                  150,
                                  child: VideoGridWidget(),
                                ),
                                Spacer(),
                                SizedBox(
                                  width: 20,
                                ),
                                ToolbarWidget(),
                              ],
                            ),
                          ),
                          if (context.watch<CallingCubit>().isAskedForHelp)
                            Positioned(
                              bottom: 148,
                              right: -10,
                              child: Container(
                                width: MediaQuery.of(context).size.width * 0.4,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 16),
                                decoration: BoxDecoration(
                                    color: Palette.kAskHelpPopup,
                                    border: Border.all(
                                      color: Palette.kWhite,
                                    ),
                                    borderRadius: BorderRadius.circular(8)),
                                child: Text(
                                  context
                                      .watch<CallingCubit>()
                                      .customHelpMessage,
                                  style: TextStyle(
                                    color: Palette.kWhite,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    decoration: TextDecoration.none,
                                  ),
                                ),
                              ),
                            ),
                          Align(
                            alignment: Alignment.bottomRight,
                            child: Container(
                              // width: 100,
                              decoration: BoxDecoration(
                                color:
                                    context.read<CallingCubit>().socketStatus ==
                                            SocketStatus.Connected
                                        ? Palette.kGreenYellow
                                        : context
                                                    .read<CallingCubit>()
                                                    .socketStatus ==
                                                SocketStatus.Disconnected
                                            ? Palette.kRedPink
                                            : Colors.orange,
                                borderRadius: BorderRadius.only(
                                  topLeft: Radius.circular(20),
                                ),
                              ),
                              padding: EdgeInsets.all(8),
                              child: context
                                          .read<CallingCubit>()
                                          .socketStatus ==
                                      null
                                  ? CupertinoActivityIndicator()
                                  : Text(
                                      context.read<CallingCubit>().socketStatus,
                                      textAlign: TextAlign.center,
                                    ),
                            ),
                          ),
                        ],
                      ),
                    );
            } else if (state is CallingError) {
              if (state.failure is CacheFailure) {
                CacheFailure error = state.failure;
                String errorMessage = error.messsage;
                if (error.messsage
                        .toLowerCase()
                        .contains(("Failed host").toLowerCase()) ==
                    true) {
                  errorMessage = "Please check your internet connection";
                }
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        errorMessage,
                        textAlign: TextAlign.center,
                        style: titleStyle.copyWith(color: Palette.kWhite),
                      ),
                      SizedBox(
                        height: 16,
                      ),
                      RawMaterialButton(
                        onPressed: () {
                          sl<NavigationService>().goBack();
                        },
                        child: Text(
                          "Get back",
                          style: subTitleStyle.copyWith(color: Palette.kWhite),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 2.0,
                        fillColor: Palette.kIconLeave,
                        padding: const EdgeInsets.all(15.0),
                      ),
                    ],
                  ),
                );
              }
              return NoInternetConnection(
                isUpcoming: false,
              );
            }
            return Container();
          },
        ),
      ),
    );
  }
}
