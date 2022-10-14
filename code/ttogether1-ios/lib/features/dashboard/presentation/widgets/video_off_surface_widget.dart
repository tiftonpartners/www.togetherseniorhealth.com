import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/imageLink.dart';

class VideoOffSurface extends StatelessWidget {
  const VideoOffSurface({
    Key key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Palette.kVideoSurface,
      child: Center(
        child: SvgPicture.asset(
          ImageLink.VIDEO_OFF,
          semanticsLabel: 'A shark?!',
          color: Palette.kIconVideoSurface,
          height: 20,
        ),
      ),
    );
  }
}
