import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

class SharedPrefKeys {
  static const String languageCode = 'languageCode';
  static const String isFirstRunning = "isFirstRunning";
  static const String REFRESH_TOKEN = "refresh_token";
  static const String BEARER_TOKEN = "bearer_token";
  static const String FORCE_TIME = "force_time";
  static const String MY_USER_INFO = "my_user_info";
  static const String CURRENT_TIME = "current_time";
}

class SharedPreferencesService {
  final SharedPreferences preferences;

  SharedPreferencesService({@required this.preferences});

  //set string
  Future<void> setUserToken(String token) async =>
      await preferences.setString(SharedPrefKeys.REFRESH_TOKEN, token);
  Future<void> setCurrentTime(String time) async =>
      await preferences.setString(SharedPrefKeys.CURRENT_TIME, time);

  Future<void> setBearerToken(String token) async =>
      await preferences.setString(SharedPrefKeys.BEARER_TOKEN, token);

  Future<void> setForceTime(String time) async =>
      await preferences.setString(SharedPrefKeys.FORCE_TIME, time);
  Future<void> setUserInfo(Map<String, dynamic> user) async => await preferences
      .setString(SharedPrefKeys.MY_USER_INFO, jsonEncode(user));

  //reset
  Future<void> reset() async {
    await setBearerToken(null);
    await setForceTime(null);
    await setCurrentTime(null);
  }

  //get String
  Future<void> setItem(String key, String value) async =>
      await preferences.setString(key, value);

  String getItem(String key) => preferences.getString(key);

  String get userToken => preferences.getString(SharedPrefKeys.REFRESH_TOKEN);
  String get currentTime => preferences.getString(SharedPrefKeys.CURRENT_TIME);
  String get bearerToken => preferences.getString(SharedPrefKeys.BEARER_TOKEN);
  String get forceTime => preferences.getString(SharedPrefKeys.FORCE_TIME);
  TshUser get userInfo {
    Map<String, dynamic> data =
        preferences.getString(SharedPrefKeys.MY_USER_INFO) != null
            ? jsonDecode(preferences.getString(SharedPrefKeys.MY_USER_INFO))
            : {};
    {}
    ;
    TshUserModel tshUserModel;
    if (data != null) {
      tshUserModel = TshUserModel.fromJson(data);
    }
    return tshUserModel;
  }
}
