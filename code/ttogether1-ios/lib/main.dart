import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:tsh/constants/router_path.dart';
import 'package:tsh/router.dart';
import 'constants/colors.dart';
import 'core/cubit/error_dialog/error_dialog_cubit.dart';
import 'core/services/navigation_service.dart';
import 'custom_multi_listener.dart';
import 'features/dashboard/presentation/cubit/deep_link/deep_link_cubit.dart';
import 'features/dashboard/presentation/cubit/get_user_info/get_user_info_cubit.dart';
import 'features/dashboard/presentation/cubit/join_class/join_class_cubit.dart';
import 'injection_container.dart';
import 'package:flutter_driver/driver_extension.dart';

void main() async {
  enableFlutterDriverExtension();
  WidgetsFlutterBinding.ensureInitialized();
  await init();
  runApp(
    MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (BuildContext context) => sl<DialogCubit>(),
        ),
        BlocProvider(
          create: (BuildContext context) => sl<DeepLinkCubit>(),
        ),
        BlocProvider(
          create: (context) => sl<GetUserInfoCubit>(),
        ),
        BlocProvider(
          create: (context) => sl<JoinClassCubit>(),
        ),
      ],
      child: MyApp(),
    ),
  );
  configLoading();
}

void configLoading() {
  EasyLoading.instance
    ..indicatorType = EasyLoadingIndicatorType.pulse
    ..loadingStyle = EasyLoadingStyle.light
    ..indicatorSize = 45.0
    ..radius = 10.0
    ..maskColor = Colors.black.withOpacity(0.5)
    ..maskType = EasyLoadingMaskType.black
    ..userInteractions = false
    ..dismissOnTap = false;
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return CustomMultiListener(
      child: MaterialApp(
        title: 'TSH',
        navigatorKey: sl<NavigationService>().navigatorKey,
        onGenerateRoute: generateRoute,
        debugShowCheckedModeBanner: false,
        builder: EasyLoading.init(),
        theme: ThemeData(
          textTheme: GoogleFonts.amikoTextTheme(),
          primaryIconTheme: IconThemeData(
            color: Palette.kWhite, //change your color here
          ),
          appBarTheme: AppBarTheme(
            color: Palette.kAppBar,
          ),
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        initialRoute: RoutePath.ROOT,
      ),
    );
  }
}
