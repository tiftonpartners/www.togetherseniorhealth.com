import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:collection/collection.dart';
import 'package:data_connection_checker/data_connection_checker.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/core/network/network_info.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/core/usecases/usecase.dart';
import 'package:tsh/core/util/input_converter.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/usecases/upcoming_adhoc_class_usecase.dart';
import 'package:tsh/features/dashboard/domain/usecases/upcoming_classes_usecase.dart';

part 'upcoming_classes_state.dart';

class UpcomingClassesCubit extends Cubit<UpcomingClassesState> {
  final UpcomingClassesUsecase upcomingClassesUsecase;
  final UpcomingAdhocClassUsecase upcomingAdhocClassUsecase;
  final NetworkInfo networkInfo;
  final SharedPreferencesService sharedPreferencesService;
  final InputConverter inputConverter;
  StreamSubscription<DataConnectionStatus> _internetConnection;
  Timer _timer;
  List<bool> _enterClassesStatus = [];
  List<String> _action = [];
  List<String> _status = [];

  List<ClassesModel> classes = [];
  String userId;

  UpcomingClassesCubit({
    @required this.upcomingClassesUsecase,
    @required this.upcomingAdhocClassUsecase,
    @required this.sharedPreferencesService,
    @required this.networkInfo,
    @required this.inputConverter,
  }) : super(UpcomingClassesInitial()) {
    userId = sharedPreferencesService?.userInfo?.userInfo?.userData?.userId;
    if (sharedPreferencesService.forceTime != null) {
      int detaDurationSecond = 0;
      if (sharedPreferencesService.currentTime != null) {
        detaDurationSecond = DateTime.now()
            .difference(DateTime.parse(sharedPreferencesService.currentTime))
            .inSeconds;
      }

      if (detaDurationSecond > 0) {
        DateTime update = DateTime.parse(sharedPreferencesService.forceTime)
            .add(Duration(seconds: detaDurationSecond));
        sharedPreferencesService.setForceTime(update.toString());
      }
    }

    _internetConnection = networkInfo.streamInternetConnection
        .listen((DataConnectionStatus event) {
      if (event.index == 0) {
        emit(UpcomingClassesInitial());
        return emit(
            UpcomingClassesError(failure: ServerFailure(Label.NO_INTERNET)));
      } else {
      }
    });
    _timer = new Timer.periodic(
      Duration(seconds: 1),
      (Timer timer) async {
        DateTime update;
        if (sharedPreferencesService.forceTime != null) {
          update = DateTime.parse(sharedPreferencesService.forceTime)
              .add(Duration(seconds: 1));
          await sharedPreferencesService.setForceTime(update.toString());
          await sharedPreferencesService
              .setCurrentTime(DateTime.now().toLocal().toString());
        }
        List<String> tempStatus = [];
        List<String> tempAcion = [];
        List<bool> tempEnter = [];
        classes.forEach((element) {
          Map<String, dynamic> canEnter =
              inputConverter.showSessionState(element);
          tempEnter.add(canEnter["canEnter"]);
          tempAcion.add(canEnter["action"]);
          tempStatus.add(canEnter["status"]);
        });
        if (_enterClassesStatus.length == 0) {
          _enterClassesStatus = tempEnter;
        }
        if (_status.length == 0) {
          _status = tempStatus;
        }
        if (_action.length == 0) {
          _action = tempAcion;
        }
        Function eq = const ListEquality().equals;
        if (!eq(_enterClassesStatus, tempEnter) ||
            !eq(_status, tempStatus) ||
            !eq(_action, tempAcion)) {
          _enterClassesStatus = tempEnter;
          _status = tempStatus;
          _action = tempAcion;
          onRender();
        }
      },
    );
  }

  void onUpcomingClass({String forceTime}) async {
    emit(UpcomingClassesInitial());
    emit(UpcomingClassesLoading());
    classes.clear();
    final upcomingClasses = await upcomingClassesUsecase(forceTime);
    upcomingClasses.fold((error) => emit(UpcomingClassesError(failure: error)),
        (upcoming) async {
      List<ClassesModel> classes = [];
      classes.addAll(upcoming);
      final upcomingAdhocClasses = await upcomingAdhocClassUsecase(NoParams());
      upcomingAdhocClasses
          .fold((error) => emit(UpcomingClassesError(failure: error)),
              (adhocClasses) {
        adhocClasses = adhocClasses.map((e) {
          e.isAdhoc = true;
          return e;
        }).toList();
        classes.addAll(adhocClasses);
      });
      classes.sort((a, b) {
        if (a.sessions.length == 0 || b.sessions.length == 0) {
          return 1;
        }
        DateTime aTime = DateTime.parse(a.sessions[0].lobbyOpenTime);
        DateTime bTime = DateTime.parse(b.sessions[0].lobbyOpenTime);
        if (a.isAdhoc == true && b.isAdhoc == false) {
          return 1;
        } else if (a.isAdhoc == false && b.isAdhoc == true) {
          return -1;
        }
        if (aTime.isBefore(bTime)) {
          return -1;
        } else if (aTime.isAtSameMomentAs(bTime)) {
          return 0;
        }
        return 1;
      });
      this.classes = classes;
      emit(
        UpcomingClassesLoaded(),
      );
    });
  }

  onRender() {
    emit(UpcomingClassesInitial());
    emit(
      UpcomingClassesLoaded(),
    );
  }

  Future<void> dispose() async {
    print("close upcoming");
    _timer?.cancel();
    await _internetConnection?.cancel();
  }

  @override
  Future<void> close() async {
    await dispose();
    return super.close();
  }
}
