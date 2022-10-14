import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:timer_builder/timer_builder.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/constants/style.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/core/util/input_converter.dart';
import 'package:tsh/features/auth/presentation/cubit/cubit/auth_cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:tsh/features/dashboard/presentation/cubit/join_class/join_class_cubit.dart';
import 'package:tsh/features/dashboard/presentation/widgets/upcoming_widget.dart';
import 'package:tsh/injection_container.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text('TSH'),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () {
              context.read<AuthCubit>().onLogout();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Row(
              children: [
                Expanded(
                  child: Container(
                    alignment: Alignment.centerLeft,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 4, vertical: 16),
                    child: Image.asset('assets/splash.png'),
                    height: 100,
                  ),
                ),
                Spacer(),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      TimerBuilder.periodic(Duration(seconds: 1),
                          builder: (context) {
                        return Text(
                            sl<InputConverter>()
                                .convertTime(
                                    time: context
                                        .read<JoinClassCubit>()
                                        .getForceTime())
                                .split('-')[0],
                            style: subTitleStyle.copyWith(fontSize: 16));
                      }),
                      TimerBuilder.periodic(Duration(seconds: 1),
                          builder: (context) {
                        DateTime time = sl<SharedPreferencesService>()
                                    .forceTime !=
                                null
                            ? DateTime.parse(
                                    sl<SharedPreferencesService>().forceTime)
                                .toLocal()
                            : DateTime.now();

                        return Text(
                          "${DateFormat("hh:mm:ss a").format(time)}",
                          style: titleStyle.copyWith(fontSize: 14),
                        );
                      }),
                    ],
                  ),
                )
              ],
            ),
            BlocBuilder<AuthCubit, AuthState>(
              builder: (context, state) {
                return Center(
                  child: Text(
                    "${Label.WELCOME}, ${context.read<AuthCubit>().user.userInfo.userData.name ?? Label.NO_NAME}",
                    style: titleStyle,
                  ),
                );
              },
            ),
            Padding(padding: EdgeInsets.symmetric(vertical: 20)),
            Expanded(child: UpcomingWidget())
          ],
        ),
      ),
    );
  }
}
