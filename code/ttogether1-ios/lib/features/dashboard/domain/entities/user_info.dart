import 'package:flutter/material.dart';
import 'package:tsh/features/dashboard/domain/entities/user_data.dart';

class UserInfo {
  int userNumber;
  UserData userData;
  var permissions;
  var roles;
  int userDataLastSet;

  UserInfo({
    @required this.userNumber,
    @required this.userData,
    @required this.permissions,
    @required this.roles,
    @required this.userDataLastSet,
  });
}
