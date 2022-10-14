import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:tap_debouncer/tap_debouncer.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/imageLink.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/constants/style.dart';
import 'package:tsh/features/dashboard/presentation/cubit/calling/calling_cubit.dart';
import 'package:tsh/features/dashboard/presentation/widgets/text_button_widget.dart';

import 'guest_toolbar_widget.dart';

class ToolbarWidget extends StatefulWidget {
  @override
  _ToolbarWidgetState createState() => _ToolbarWidgetState();
}

class _ToolbarWidgetState extends State<ToolbarWidget> {
  Widget space = SizedBox(
    height: 24,
  );
  @override
  Widget build(BuildContext context) {
    CallingCubit callingCubit = context.read<CallingCubit>();
    CallingCubit callingCubitListen = context.watch<CallingCubit>();

    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      children: <Widget>[
        space,
        TextIconButton(
          iconColor: Palette.kIconVideoMic,
          iconUrl: callingCubitListen.muted ? ImageLink.MUTE : ImageLink.UNMUTE,
          text: callingCubitListen.muted ? Label.UNMUTE : Label.MUTE,
          onTap: () async {
            callingCubit.onToggleMute();
          },
        ),
        space,
        TextIconButton(
          iconColor: Palette.kIconVideoMic,
          iconUrl: callingCubitListen.isTurnOff
              ? ImageLink.VIDEO_OFF
              : ImageLink.VIDEO_ON,
          text: callingCubitListen.isTurnOff ? Label.TURN_ON : Label.TURN_OFF,
          onTap: () async {
            callingCubit.onTurnVideo();
          },
        ),
        space,
        TapDebouncer(
          onTap: () async {
            await callingCubit.startOver();
          },
          builder: (BuildContext context, Future<void> Function() onTap) {
            return TextIconButton(
              iconUrl: ImageLink.START_OVER,
              iconColor: Palette.kIconStarOver,
              text: Label.START_OVER,
              onTap: onTap,
            );
          },
        ),
        space,
        TextIconButton(
          iconColor: Palette.kIconLeave,
          iconUrl: ImageLink.LEAVE,
          text: Label.LEAVE,
          onTap: () async {
            showDialog(
                context: context,
                builder: (_) => new AlertDialog(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.all(Radius.circular(10)),
                          side: BorderSide(color: Palette.kPurple, width: 5.5)),
                      title: new Text(
                        Label.LEAVE_OR_END_CLASS,
                        textAlign: TextAlign.start,
                        style: titleStyle.copyWith(
                          fontSize: 24,
                        ),
                      ),
                      content: Container(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            new Text(
                              Label.LEAVE_CLASS_CONTENT,
                              textAlign: TextAlign.start,
                              style: subTitleStyle.copyWith(
                                fontSize: 20,
                              ),
                            ),
                            SizedBox(
                              height: 24,
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.start,
                              children: [
                                DialogButton(
                                  borderColor: Palette.kGreenYellow,
                                  color: Palette.kWhite,
                                  textColor: Palette.kBlack,
                                  text: Label.CANCEL,
                                  onTap: () {},
                                ),
                                SizedBox(
                                  width: 16,
                                ),
                                DialogButton(
                                  borderColor: Palette.kGrey,
                                  color: Palette.kGreenYellow,
                                  textColor: Palette.kBlack,
                                  text: Label.LEAVE_DIALOG,
                                  onTap: () {
                                    callingCubit.onCallEnd();
                                  },
                                ),
                              ],
                            )
                          ],
                        ),
                      ),
                      backgroundColor: Colors.white,
                    ));
          },
        ),
        Spacer(),
        TextIconButton(
          isRow: true,
          color: context.watch<CallingCubit>().isAskedForHelp
              ? Palette.kButtonCallLight
              : Palette.kButtonCall,
          textColor: context.watch<CallingCubit>().isAskedForHelp
              ? Palette.kButtonCall
              : Palette.kButtonCallLight,
          iconColor: Palette.kIconAskHelp,
          iconUrl: ImageLink.GET_HELP,
          text: Label.GET_HELP,
          onTap: () async {
            callingCubit.globalEventService.doAskForHelpClick();
          },
        ),
        SizedBox(
          height: 56,
        ),
      ],
    );
  }
}
