import 'package:flutter/material.dart';
import 'package:tsh/features/dashboard/domain/entities/app_meta_data.dart';
import 'package:tsh/features/dashboard/domain/entities/identities.dart';

import 'package:flutter_test/flutter_test.dart';

main() {
  final userData = UserData(
    appMetadata:
        AppMetadata(programs: "RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP"),
    createdAt: "2021-03-30T20:13:16.815Z",
    email: "instructor-ios-1@tsh.care",
    emailVerified: false,
    identities: [
      Identities(
          userId: "6063865c77b322006822b2d0",
          provider: "auth0",
          connection: "Username-Password-Authentication",
          isSocial: false)
    ],
    name: "instructor-ios-1",
    nickname: "instructor-ios-1",
    picture:
        "https://s.gravatar.com/avatar/188c9323d5ae2ccaaf827d12368de96d?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fin.png",
    updatedAt: "2021-03-30T20:46:17.317Z",
    userId: "auth0|6063865c77b322006822b2d0",
    username: "instructorios1",
  );

  test(
    'should be a subclass of UserData entity',
    () async {
      // assert
      expect(userData, isA<UserData>());
    },
  );
}

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
