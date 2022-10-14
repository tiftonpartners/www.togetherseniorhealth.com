import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/imageLink.dart';
import 'package:tsh/core/data/enum/enums.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

class InfoUserWidget extends StatelessWidget {
  const InfoUserWidget({
    Key key,
    @required this.userInfo,
    @required this.localUserNumber,
    @required this.localMute,
    @required this.remoteUsers,
    @required this.isLocal,
    @required this.isLocalSpeaking,
    @required this.isRemoteSpeaking,
  }) : super(key: key);

  final TshUser userInfo;
  final List<RemoteStreamInfo> remoteUsers;
  final int localUserNumber;
  final bool localMute;
  final bool isLocalSpeaking;
  final bool isRemoteSpeaking;
  final bool isLocal;

  @override
  Widget build(BuildContext context) {
    return Container(
        alignment: Alignment.centerLeft,
        padding: EdgeInsets.symmetric(horizontal: 8),
        width: double.infinity,
        color: (isLocalSpeaking || isRemoteSpeaking)
            ? Palette.kInfoBackgroundLight
            : Palette.kInfoBackgroundDark,
        child: Row(
          children: [
            if (userInfo != null &&
                userInfo.userInfo.userNumber == localUserNumber &&
                localMute)
              SvgPicture.asset(
                ImageLink.WHITE_MUTE,
                semanticsLabel: 'A shark?!',
                height: 16,
              ),
            ...List.generate(remoteUsers.length, (i) {
              if (userInfo != null &&
                  remoteUsers[i].tshUser.userInfo.userNumber ==
                      userInfo.userInfo.userNumber &&
                  remoteUsers[i].isMuted) {
                return SvgPicture.asset(
                  ImageLink.WHITE_MUTE,
                  semanticsLabel: 'A shark?!',
                  height: 16,
                );
              }

              return Container();
            }),
            Text(
              userInfo?.userInfo?.userData?.name ?? "",
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          ],
        ));
  }
}
