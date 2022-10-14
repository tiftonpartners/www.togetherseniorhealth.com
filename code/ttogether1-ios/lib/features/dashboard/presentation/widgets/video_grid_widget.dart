import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/constants.dart';
import 'package:tsh/core/data/enum/enums.dart';
import 'package:tsh/core/util/input_converter.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

import 'package:tsh/features/dashboard/presentation/cubit/calling/calling_cubit.dart';
import 'package:tsh/features/dashboard/presentation/widgets/video_off_surface_widget.dart';
import 'package:tsh/injection_container.dart';

import 'info_user_widget.dart';

class VideoGridWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    bool groupViewMode =
        context.watch<CallingCubit>().currentView == EClientView.GROUP;
    final tshUserList = context.watch<CallingCubit>().tshUserList;
    final spotlightUsersList = context.watch<CallingCubit>().spotlightUsersList;

    var size = MediaQuery.of(context).size;
    final isLanscape = size.width > size.height;
    final views = context.read<CallingCubit>().getRenderViews(isLanscape);
    int numberGrid = tshUserList.length <= 4
        ? isLanscape
            ? 2
            : 1
        : isLanscape
            ? Constants.GRID_SIZE_LANSCAPE
            : Constants.GRID_SIZE_PROTRAIT;

    CallingCubit contextListener = context.watch<CallingCubit>();
    return GridView.count(
      physics: NeverScrollableScrollPhysics(),
      crossAxisCount:
          groupViewMode ? numberGrid : Constants.SPOTLIGHT_INSTRUCTOR,
      childAspectRatio: ((size.width - 130)) /
          (((size.width - 170) *
              (sl<InputConverter>().dynamicRatio(size.longestSide,
                  size.shortestSide, groupViewMode, isLanscape)))),
      // childAspectRatio: isLanscape
      //     ? (itemWidth / itemHeight)
      //     : (itemHeight / itemWidth),
      controller: new ScrollController(keepScrollOffset: false),
      shrinkWrap: true,
      children: List.generate(views.length, (index) {
        return (views[index] == null && !groupViewMode)
            ? context.watch<CallingCubit>().currentView == EClientView.SPOTLIGHT
                // Spotlight mode
                ? GroupVideoInfo(
                    view: VideoOffSurface(),
                    localMuted: contextListener.muted,
                    userNumber: contextListener.myUserNumber,
                    groupViewMode: groupViewMode,
                    tshUser: tshUserList[index],
                    contextListener: contextListener,
                    localUser: contextListener.localUsers,
                    remoteUsers: contextListener.remoteUsers,
                    spotlightUser:
                        groupViewMode ? null : spotlightUsersList[index],
                    askedForHelp:
                        contextListener.globalEventService.askedForHelp,
                  ) // Intrusctor mode
                : (index == 0)
                    ? VideoOffGroupVideoInfo(
                        view: VideoOffSurface(),
                        localMuted: contextListener.muted,
                        userNumber: contextListener.myUserNumber,
                        groupViewMode: groupViewMode,
                        tshUser: null,
                        contextListener: contextListener,
                        localUser: contextListener.localUsers,
                        remoteUsers: [],
                        spotlightUser: null,
                        askedForHelp:
                            contextListener.globalEventService.askedForHelp,
                      )
                    : Container()
            // Group mode
            : GroupVideoInfo(
                view: views[index],
                localMuted: contextListener.muted,
                userNumber: contextListener.myUserNumber,
                groupViewMode: groupViewMode,
                tshUser: tshUserList[index],
                contextListener: contextListener,
                localUser: contextListener.localUsers,
                remoteUsers: contextListener.remoteUsers,
                spotlightUser: groupViewMode ? null : spotlightUsersList[index],
                askedForHelp: contextListener.globalEventService.askedForHelp,
              );
      }),
    );
  }
}

class VideoOffGroupVideoInfo extends StatelessWidget {
  const VideoOffGroupVideoInfo(
      {Key key,
      @required this.view,
      @required this.groupViewMode,
      @required this.tshUser,
      @required this.contextListener,
      @required this.spotlightUser,
      @required this.askedForHelp,
      @required this.userNumber,
      @required this.localMuted,
      @required this.localUser,
      @required this.remoteUsers})
      : super(key: key);

  final Widget view;
  final bool groupViewMode, askedForHelp, localMuted;
  final TshUser tshUser;
  final CallingCubit contextListener;
  final TshUser spotlightUser;
  final int userNumber;
  final RemoteStreamInfo localUser;
  final List<RemoteStreamInfo> remoteUsers;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4.0),
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
                child: Stack(
                  children: [
                    VideoCard(
                      view: view,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class GroupVideoInfo extends StatelessWidget {
  const GroupVideoInfo(
      {Key key,
      @required this.view,
      @required this.groupViewMode,
      @required this.tshUser,
      @required this.contextListener,
      @required this.spotlightUser,
      @required this.askedForHelp,
      @required this.userNumber,
      @required this.localMuted,
      @required this.localUser,
      @required this.remoteUsers,
      this.testByPassLocal = false})
      : super(key: key);

  final Widget view;
  final bool groupViewMode, askedForHelp, localMuted;
  final TshUser tshUser;
  final CallingCubit contextListener;
  final TshUser spotlightUser;
  final int userNumber;
  final RemoteStreamInfo localUser;
  final List<RemoteStreamInfo> remoteUsers;
  final bool testByPassLocal;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4.0),
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
                child: Stack(
                  children: [
                    VideoCard(
                      view: view,
                    ),
                    // if ((tshUser != null &&
                    //     remoteUsers
                    //             .where((element) =>
                    //                 element.tshUser.userInfo.userNumber ==
                    //                 tshUser.userInfo.userNumber)
                    //             .length >
                    //         0 &&
                    //     remoteUsers
                    //         .firstWhere((element) =>
                    //             element.tshUser.userInfo.userNumber ==
                    //             tshUser.userInfo.userNumber)
                    //         .isVideoMuted))
                    //   VideoOffSurface(),
                    // if ((localUser != null && localUser.isVideoMuted))
                    //   VideoOffSurface(),
                  ],
                ),
              ),
              InfoUserWidget(
                userInfo: groupViewMode ? tshUser : spotlightUser,
                isLocal: (tshUser != null &&
                    tshUser.userInfo.userNumber == userNumber),
                localUserNumber: userNumber,
                localMute: localMuted,
                remoteUsers: remoteUsers,
                isLocalSpeaking: (tshUser != null &&
                    tshUser.userInfo.userNumber == userNumber &&
                    localUser.isSpeaking),
                isRemoteSpeaking: (tshUser != null &&
                    remoteUsers
                            .where((element) =>
                                element.tshUser.userInfo.userNumber ==
                                tshUser.userInfo.userNumber)
                            .length >
                        0 &&
                    remoteUsers
                        .firstWhere((element) =>
                            element.tshUser.userInfo.userNumber ==
                            tshUser.userInfo.userNumber)
                        .isSpeaking),
              )
            ],
          ),
        ),
      ),
    );
  }
}

class VideoCard extends StatelessWidget {
  const VideoCard({
    Key key,
    @required this.view,
  }) : super(key: key);

  final Widget view;

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Container(
        child: view ?? Container(),
      ),
      decoration: BoxDecoration(
        color: Palette.kVideoBackground,
      ),
    );
  }
}
