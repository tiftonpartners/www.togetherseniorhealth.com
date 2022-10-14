import 'package:flutter/material.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

class HomeParameters {
  final TshUser myUserInfo;

  HomeParameters({
    @required this.myUserInfo,
  });
}
