import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:tsh/constants/constants.dart';
import 'package:tsh/constants/labels.dart';
import 'package:tsh/core/error/exceptions.dart';
import 'package:tsh/core/services/share_preferences_service.dart';

class NetworkCall {
  final http.Client client;
  final SharedPreferencesService preference;
  NetworkCall({
    @required this.client,
    @required this.preference,
  });

  //GET
  Future<String> createJwt(String ticket, {String forceTime}) async {
    String endpoint = "/api/v1/pwdless/token/$ticket";
    if (forceTime != null) {
      endpoint = "/api/v1/pwdless/token/$ticket?forceTime=$forceTime";
    }
    return await _getMethod(
      endpoint,
      hasToken: true,
    );
  }

  Future<String> upcomingClasses({String forceTime}) async {
    String force = "";
    if (forceTime != null) {
      force = "?forceTime=$forceTime";
    }
    return await _getMethod("/api/v1/classes/me/upcoming$force",
        hasToken: true);
  }

  Future<String> upcomingAdhocClasses({String forceTime}) async {
    String force = "";
    if (forceTime != null) {
      force = "?forceTime=$forceTime";
    }
    return await _getMethod("/api/v1/adhoc-sessions/upcoming/me$force",
        hasToken: true);
  }

  Future<String> getClassInfo({
    @required String class1Acronym,
  }) async {
    return await _getMethod(
      "/api/v1/classes/acronym/$class1Acronym",
      hasToken: true,
    );
  }

  Future<String> getUserInfo({
    @required String user2Id,
    bool isId,
  }) async {
    //user2Id = auth0|5fc55527e4379a00768cf119
    if (isId == null) {
      isId = true;
    }
    String enpoint =
        isId ? "/api/v1/users/id/$user2Id" : "/api/v1/users/$user2Id";
    return await _getMethod(
      enpoint,
      hasToken: true,
    );
  }

  Future<String> createAgoraToken(String jwt, {String accronym}) async {
    return await _getMethod(
      "/api/v1/video/agora/token/$accronym",
      hasToken: true,
      token: jwt,
    );
  }

  Future<String> createAgoraAdhocToken(String accronym) async {
    return await _getMethod(
      "/api/v1/video/agora/adhoc-token/$accronym",
      hasToken: true,
    );
  }

  //Internal method
  Future<String> _getMethod(String endpoint,
      {bool hasToken = false, String token}) async {
    try {
      Map<String, String> header =
          headerRequest(hasToken: hasToken, token: token);
      final response = await client
          .get(Constants.BASE_URL + endpoint, headers: header)
          .timeout(
        Constants.DURATION_TIMEOUT,
        onTimeout: () {
          throw TimeoutException(Label.TIME_OUT);
        },
      );
      return _validateResponse(response: response);
    } on TimeoutException catch (timeOut) {
      throw ServerException(message: timeOut.message);
    } catch (error, stackTrace) {
      throw ServerException(message: error.message);
    }
  }

  Map<String, String> headerRequest({@required bool hasToken, String token}) {
    Map<String, String> header = {};
    if (hasToken) {
      String bearerToken = preference.getItem(SharedPrefKeys.BEARER_TOKEN);
      header = {
        'Authorization': 'Bearer ${token ?? bearerToken}',
      };
    } else {
      header = {
        'Content-Type': 'application/json',
      };
    }
    return header;
  }

  String _validateResponse({http.Response response}) {
    if (response.statusCode != 200) {
      Map<String, dynamic> body = json.decode(response.body);
      throw ServerException(message: body['message']);
    }
    return response.body;
  }
}
