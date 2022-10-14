import 'package:flutter/material.dart';

import 'app_meta_data.dart';
import 'identities.dart';

class UserData {
  String createdAt;
  String email;
  bool emailVerified;
  List<Identities> identities;
  String name;
  String nickname;
  String picture;
  String updatedAt;
  String userId;
  String username;
  AppMetadata appMetadata;

  UserData({
    @required this.createdAt,
    @required this.email,
    @required this.emailVerified,
    @required this.identities,
    @required this.name,
    @required this.nickname,
    @required this.picture,
    @required this.updatedAt,
    @required this.userId,
    @required this.username,
    @required this.appMetadata,
  });
}
