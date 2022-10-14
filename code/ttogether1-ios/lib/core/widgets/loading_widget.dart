import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/constants.dart';

class LoadingWidget extends StatelessWidget {
  const LoadingWidget({
    Key key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: Constants.LOADING_BACKGROUND_SIZE,
        height: Constants.LOADING_BACKGROUND_SIZE,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(Constants.RADIUS),
          color: Palette.kBackgroundLoadingColor,
        ),
        child: SpinKitDoubleBounce(
          color: Palette.kLoadingColor,
          size: Constants.LOADING_SIZE,
        ),
      ),
    );
  }
}
