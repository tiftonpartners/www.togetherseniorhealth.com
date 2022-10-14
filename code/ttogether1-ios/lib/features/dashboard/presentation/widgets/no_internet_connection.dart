import 'package:flutter/material.dart';
// import 'package:system_settings/system_settings.dart';
import 'package:open_settings/open_settings.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/style.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/presentation/cubit/upcoming_class/upcoming_classes_cubit.dart';
import 'package:tsh/injection_container.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class NoInternetConnection extends StatelessWidget {
  final bool isUpcoming;
  const NoInternetConnection({Key key, @required this.isUpcoming})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "Please check your Internet connection",
              textAlign: TextAlign.center,
              style: titleStyle.copyWith(
                  color: isUpcoming ? Palette.kBlack : Palette.kWhite),
            ),
            SizedBox(
              height: 16,
            ),
            RawMaterialButton(
              onPressed: () async {
                if (isUpcoming) {
                  context.read<UpcomingClassesCubit>().onUpcomingClass(
                      forceTime: sl<SharedPreferencesService>().forceTime);
                } else {
                  // await SystemSettings.wifi();
                  // AppSettings.openWIFISettings();
                  OpenSettings.openWIFISetting();
                }
              },
              child: isUpcoming
                  ? Icon(Icons.refresh)
                  : Text(
                      "Network settings",
                      style: subTitleStyle,
                    ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 2.0,
              fillColor: Palette.kButtonCall,
              padding: const EdgeInsets.all(15.0),
            ),
          ],
        ),
      ),
    );
  }
}
