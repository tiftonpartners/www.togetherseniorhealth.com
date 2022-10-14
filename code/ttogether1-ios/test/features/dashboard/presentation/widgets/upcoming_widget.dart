import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:responsive_builder/responsive_builder.dart';
import 'package:skeleton_animation/skeleton_animation.dart';
import 'package:tsh/constants/colors.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/constants/style.dart';
import 'package:tsh/core/util/input_converter.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/presentation/cubit/get_user_info/get_user_info_cubit.dart';
import 'package:tsh/features/dashboard/presentation/cubit/upcoming_class/upcoming_classes_cubit.dart';
import 'package:tsh/injection_container.dart';

import 'no_internet_connection.dart';

class UpcomingWidget extends StatelessWidget {
  const UpcomingWidget({
    Key key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<UpcomingClassesCubit, UpcomingClassesState>(
      listener: (context, state) {
        sl<GlobalFunctions>().manageState(
          context,
          state,
          isLoadingState: false,
          isErrorState: state is UpcomingClassesError,
        );
      },
      builder: (context, state) {
        if (state is UpcomingClassesLoaded) {
          return SingleChildScrollView(
            child: Container(
              padding: EdgeInsets.all(22),
              child: Column(
                children: List.generate(
                    context.read<UpcomingClassesCubit>().classes.length,
                    (index) {
                  ClassesModel currentClass =
                      context.read<UpcomingClassesCubit>().classes[index];

                  Map<String, dynamic> sessionStatus =
                      sl<InputConverter>().showSessionState(currentClass);
                  return ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: 626, maxHeight: 450),
                    child: Column(
                      children: [
                        ConstrainedBox(
                          constraints:
                              BoxConstraints(minHeight: 200, maxHeight: 250),
                          child: Card(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(25),
                            ),
                            elevation: 2,
                            child: Padding(
                              padding: const EdgeInsets.all(32.0),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 80.0,
                                    backgroundImage: NetworkImage(
                                        "${sessionStatus['image']}",
                                        scale: 200),
                                    backgroundColor: Colors.transparent,
                                  ),
                                  SizedBox(
                                    width: 16,
                                  ),
                                  Expanded(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          currentClass.name,
                                          style: titleStyle,
                                          textAlign: TextAlign.start,
                                        ),
                                        RichText(
                                          text: TextSpan(
                                            children: [
                                              TextSpan(
                                                text: "with ",
                                                style: subTitleStyle.copyWith(
                                                    fontSize: 20),
                                              ),
                                              TextSpan(
                                                text: currentClass
                                                    ?.instructor?.name,
                                                style: titleStyle.copyWith(
                                                    fontSize: 20),
                                              ),
                                            ],
                                          ),
                                        ),
                                        SizedBox(
                                          height: 16,
                                        ),
                                        if (sessionStatus["startTime"] != "")
                                          Expanded(
                                            child: Text(
                                                "${sessionStatus["startTime"]}",
                                                style: subTitleStyle.copyWith(
                                                    fontSize: 20)),
                                          ),
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Center(
                            child: Column(
                              children: [
                                Text(
                                  "${sessionStatus['status']}",
                                  style: titleStyle.copyWith(fontSize: 20),
                                ),
                                SizedBox(
                                  height: 8,
                                ),
                                Text(
                                  "${sessionStatus['action']}",
                                  style: subTitleStyle.copyWith(fontSize: 20),
                                ),
                                SizedBox(
                                  height: 8,
                                ),
                                if (sessionStatus['canEnter'])
                                  Center(
                                    child: Container(
                                      width: MediaQuery.of(context).size.width *
                                          (getDeviceType(MediaQuery.of(context)
                                                      .size) ==
                                                  DeviceScreenType.mobile
                                              ? 0.5
                                              : 0.7),
                                      height: 48,
                                      child: MaterialButton(
                                        onPressed: () {
                                          context
                                              .read<GetUserInfoCubit>()
                                              .onGetMyInfo(
                                                currentClass,
                                              );
                                        },
                                        disabledColor: Colors.grey,
                                        height: 56,
                                        color: Palette.kButtonEnterClass,
                                        child: Text(
                                          Label.ENTER_CLASSROOM,
                                          style: TextStyle(
                                              color: Palette.kBlack,
                                              fontSize: 18),
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                        SizedBox(
                          height: 8,
                        ),
                        if ((context
                                    .read<UpcomingClassesCubit>()
                                    .classes
                                    .length >
                                1) &&
                            (index + 1 !=
                                context
                                    .read<UpcomingClassesCubit>()
                                    .classes
                                    .length))
                          Divider(
                            thickness: 1,
                            color: Color(0xff7b7b7b),
                          ),
                      ],
                    ),
                  );
                }),
              ),
            ),
          );
        } else if (state is UpcomingClassesLoading) {
          return Padding(
            padding: const EdgeInsets.all(8.0),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxHeight: 626),
              child: GridView.count(
                crossAxisCount: 1,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 16 / 9,
                children: List.generate(
                    4,
                    (index) => Skeleton(
                          borderRadius: BorderRadius.circular(16),
                          height: 12,
                          style: SkeletonStyle.box,
                        )),
              ),
            ),
          );
        } else if (state is UpcomingClassesError) {
          return NoInternetConnection(
            isUpcoming: true,
          );
        }

        return Container();
      },
    );
  }
}
