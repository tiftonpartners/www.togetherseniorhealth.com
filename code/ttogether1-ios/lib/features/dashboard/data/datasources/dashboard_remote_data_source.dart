import 'dart:convert';

import 'package:meta/meta.dart';
import 'package:tsh/core/network/network_call.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

abstract class DashboardRemoteDataSource {
  Future<String> createJwt({String ticket, String forceTime, bool shouldSave});
  Future<AgoraModel> createAgoraToken({
    String jwt,
  });
  Future<AgoraModel> createSecuredAgoraToken({String accronym});
  Future<List<ClassesModel>> upcomingClasses({
    String forceTime,
  });
  Future<List<ClassesModel>> upcomingAdhocClasses();
  Future<ClassesModel> getClassInfo({
    @required String class1Acronym,
  });
  Future<TshUser> getUserInfo({
    @required String user2Id,
    bool isId,
  });
  String getForceTime();
}

class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final NetworkCall networkCall;
  final SharedPreferencesService sharedPreferencesService;
  DashboardRemoteDataSourceImpl({
    @required this.networkCall,
    @required this.sharedPreferencesService,
  });

  @override
  Future<String> createJwt(
      {String ticket, String forceTime, bool shouldSave}) async {
    var response = await networkCall.createJwt(ticket, forceTime: forceTime);
    String jwt = jsonDecode(response)['token'];
    if (shouldSave == true) {
      sharedPreferencesService.setBearerToken(jwt);
      sharedPreferencesService.setForceTime(forceTime);
    }
    return jwt;
  }

  // TODO:  We should keep that only to open a deeplink BUT a deeplink should not land to call. Only to page
  // @dev Maybe get rid of it ?
  @override
  Future<AgoraModel> createAgoraToken({String jwt}) async {
    var response = await networkCall.createAgoraAdhocToken(jwt);
    AgoraModel agora = AgoraModel.fromJson(jsonDecode(response));
    return agora;
  }

  @override
  Future<AgoraModel> createSecuredAgoraToken({String accronym}) async {
    String jwt = this.sharedPreferencesService.bearerToken;
    var response = await networkCall.createAgoraToken(jwt, accronym: accronym);
    AgoraModel agora = AgoraModel.fromJson(jsonDecode(response));
    return agora;
  }

  @override
  Future<List<ClassesModel>> upcomingClasses({String forceTime}) async {
    List<ClassesModel> listClass = [];

    // Get if there's  an upcming class coming up
    String forceTimeAPI = forceTime;
    if (forceTimeAPI == null) {
      String storedForceTime = this.sharedPreferencesService.forceTime;
      if (storedForceTime != null) {
        await this.sharedPreferencesService.setForceTime(storedForceTime);
        forceTimeAPI = storedForceTime;
      } else {
        forceTimeAPI = DateTime.now().toIso8601String();
      }
    }

    // Check if there was a forced time saved (from deep link)
    var response = await networkCall.upcomingClasses(forceTime: forceTime);
    List upcomingClasses = jsonDecode(response);
    upcomingClasses.forEach((element) {
      ClassesModel classesModel = ClassesModel.fromJson(element);
      listClass.add(classesModel);
    });
    return listClass;
  }

  @override
  Future<List<ClassesModel>> upcomingAdhocClasses() async {
    List<ClassesModel> listClass = [];
    String forceTime = this.sharedPreferencesService.forceTime;
    // Check if there was a forced time saved (from deep link)
    var response = await networkCall.upcomingAdhocClasses(forceTime: forceTime);
    List upcomingAdhocClasses = jsonDecode(response);
    upcomingAdhocClasses.forEach((element) {
      SessionModel sessionModel = SessionModel.fromJson(element);
      ClassesModel classesModel = ClassesModel.fromJson(element);
      classesModel.sessions = [sessionModel];
      listClass.add(classesModel);
    });
    return listClass;
  }

  @override
  String getForceTime() => this.sharedPreferencesService.forceTime;

  @override
  Future<ClassesModel> getClassInfo({String class1Acronym}) async {
    var response = await networkCall.getClassInfo(class1Acronym: class1Acronym);
    ClassesModel classInfo = ClassesModel.fromJson(jsonDecode(response));
    return classInfo;
  }

  @override
  Future<TshUser> getUserInfo({
    String user2Id,
    bool isId,
  }) async {
    var response = await networkCall.getUserInfo(user2Id: user2Id, isId: isId);
    Map<String, dynamic> data = jsonDecode(response);
    if (user2Id == "me") {
      data = {"userInfo": data};
    }
    TshUser classInfo = TshUserModel.fromJson(data);
    return classInfo;
  }
}
