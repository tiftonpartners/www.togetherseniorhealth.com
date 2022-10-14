import 'package:dartz/dartz.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';
import 'package:intl/intl.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/core/cubit/error_dialog/error_dialog_cubit.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/injection_container.dart';

class InputConverter {
  Either<Failure, int> stringToUnsignedInteger(String str) {
    try {
      final integer = int.parse(str);
      if (integer < 0) throw FormatException();
      return Right(integer);
    } on FormatException {
      return Left(InvalidInputFailure());
    }
  }

  double dynamicRatio(
      double longSide, double shortSide, bool isGroupView, bool isLanscape) {
    //ipad 12inch
    if (longSide >= 1366) {
      if (!isGroupView) {
        return 0.62;
      } else {
        if (isLanscape) {
          return 0.65;
        }
        return 0.6459;
      }
    }
    //ipad air
    //ipad 11inch
    else if (longSide >= 1180) {
      if (!isGroupView) {
        if (isLanscape) {
          return 0.615;
        }
        return 0.64;
      } else {
        if (isLanscape) {
          return 0.67;
        }
        return 0.68;
      }
    }
    //ipad genth
    else if (longSide >= 1080) {
      if (isLanscape) {
        return 0.6699;
      }
      return 0.6799;
    }
    //ipad mini
    else if (longSide >= 768) {
      if (isGroupView) {
        return 0.7;
      } else {
        return 0.6459;
      }
    } else {
      return 0.6459;
    }
  }

  Map<String, dynamic> showSessionState(
    ClassesModel classesModel, {
    bool isForcedTime = true,
  }) {
    String status = "";
    String actionStatus = "";
    String startTimeConvert = "";
    bool isToday = false;
    bool isOpenNow = false;
    bool isInSession = false;
    bool canEnter = false;
    String storeForceTime = sl<SharedPreferencesService>().forceTime;
    DateTime forceTime = storeForceTime != null
        ? DateTime.parse(storeForceTime)
        : DateTime.now();
    SessionModel sessionModel = classesModel?.sessions?.first;
    TimeOfDay startTime = TimeOfDay(
        hour: classesModel?.schedule?.startTime?.hour,
        minute: classesModel?.schedule?.startTime?.mins);
    var lobbyOpenTime = DateTime.parse(sessionModel.lobbyOpenTime);
    var lobbyCloseTime = DateTime.parse(sessionModel.lobbyCloseTime);
    var scheduledStartTime = DateTime.parse(sessionModel.scheduledStartTime);
    var scheduledEndTime = DateTime.parse(sessionModel.scheduledEndTime);
    if (classesModel.schedule != null) {
      final hours = startTime.hourOfPeriod;
      final minutes = startTime.minute.toString().padLeft(2, '0');
      final period = startTime.period == DayPeriod.am ? "am" : "pm";
      startTimeConvert =
          "${classesModel.schedule.weekdays.map((wd) => convertDay(wd)).join(", ")} $hours:$minutes $period";
    }
    if ((lobbyOpenTime.isBefore(forceTime) ||
            lobbyOpenTime.isAtSameMomentAs(forceTime)) &&
        lobbyCloseTime.isAfter(forceTime)) {
      status = Label.DOOR_OPEN;
      actionStatus = Label.COME_ON_IN;
      canEnter = true;
      isOpenNow = true;
      isToday = true;
      if ((scheduledStartTime.isBefore(forceTime) ||
              scheduledStartTime.isAtSameMomentAs(forceTime)) &&
          scheduledEndTime.isAfter(forceTime)) {
        isInSession = true;
        status = Label.MOVEMENT_BEGUN;
      }
    } else {
      status = Label.DOOR_NOT_OPEN;
      int timeMins = lobbyOpenTime.difference(forceTime).inMinutes;

      if (timeMins <= 60 && timeMins >= 0) {
        // If < 60 minutes until the doors open, then
        // show the time remaing
        isToday = true;
        actionStatus =
            "Come back in $timeMins minute${timeMins == 1 ? '' : 's'}";
      } else {
        // More than 60 minutes.  We want to show the time of day to comback if today or tomorrow
        String timeOfDay = DateFormat('h:mm a').format(lobbyOpenTime.toLocal());
        final today = DateTime(forceTime.toLocal().year,
            forceTime.toLocal().month, forceTime.toLocal().day);
        final tomorrow = DateTime(forceTime.toLocal().year,
            forceTime.toLocal().month, forceTime.toLocal().day + 1);

        final aDate = DateTime(
            lobbyOpenTime.year, lobbyOpenTime.month, lobbyOpenTime.day);
        if (aDate == today) {
          // It's later on today
          isToday = true;
          actionStatus = Label.DOOR_OPEN_AT + timeOfDay;
        } else if (aDate == tomorrow) {
          // It's tomorrow
          actionStatus = Label.DOOR_OPEN_TOMORROW_AT + timeOfDay;
        } else {
          // It's beyond tomorrow
          status = classesModel.sessions[0].sT == 'ClassSession'
              ? Label.NEXT_CLASS
              : Label.SESSION_SCHEDULE;
          actionStatus = convertTime(
              time: sessionModel.scheduledStartTime, isUpcoming: true);
        }
      }
    }
    return {
      "status": status,
      "isToday": isToday,
      "action": actionStatus,
      "canEnter": canEnter,
      "instructor": classesModel?.instructor?.name,
      "image": classesModel?.instructor?.picture,
      "startTime": startTimeConvert
    };
  }

  String convertDay(String dayName) {
    switch (dayName) {
      case 'mon':
        return "Monday";
      case 'tue':
        return "Tuesday";
      case 'wed':
        return "Wednesday";
      case 'thu':
        return "Thursday";
      case 'fri':
        return "Friday";
      case 'sat':
        return "Saturday";
      case 'sun':
        return "Sunday";
      default:
        return dayName;
    }
  }
  // String convertTime(String time) {
  //   final dateFormat = new DateFormat('EEEE MMMM do, yyyy\n hh:mm a');
  //   DateTime current = DateTime.parse(time).toLocal();
  //   return dateFormat.format(current);
  // }

  String convertTime({String time, bool isUpcoming = false}) {
    DateTime now = DateTime.now().toLocal();
    if (time != null) {
      now = DateTime.parse(time).toLocal();
    }
    String suffix = 'th';
    final int digit = now.day % 10;
    if ((digit > 0 && digit < 4) && (now.day < 11 || now.day > 13)) {
      suffix = <String>['st', 'nd', 'rd'][digit - 1];
    }
    return DateFormat(isUpcoming
            ? "EEEE, MMMM d'$suffix' yyyy, hh:mm a"
            : "EEEE, MMMM d'$suffix' yyyy-hh:mm a")
        .format(now); // 'Sun, Jun 30th'
  }
}

class GlobalFunctions {
  void manageState(
    BuildContext context,
    state, {
    VoidCallback onOtherState,
    @required bool isLoadingState,
    @required bool isErrorState,
    bool isDismiss = true,
  }) {
    if (isLoadingState) {
      EasyLoading.show(status: 'loading...');
    } else {
      if (isDismiss) {
        EasyLoading.dismiss();
      }
      if (isErrorState) {
        EasyLoading.dismiss();
        Future.delayed(Duration(milliseconds: 300), () {
          context.read<DialogCubit>().showErrorDialog(state.failure);
        });
      }
      if (onOtherState != null) {
        onOtherState();
        EasyLoading.dismiss();
      }
    }
  }
}

class InvalidInputFailure extends Failure {}
