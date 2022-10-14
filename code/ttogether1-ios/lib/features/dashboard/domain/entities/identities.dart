import 'package:flutter/material.dart';

class Identities {
  String connection;
  String userId;
  String provider;
  bool isSocial;

  Identities({
    @required this.connection,
    @required this.userId,
    @required this.provider,
    @required this.isSocial,
  });
  Identities.fromJson(Map<String, dynamic> json);

  Map<String, dynamic> toJson() {}
}
