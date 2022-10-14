import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/home_parameters.dart';
import 'package:tsh/features/dashboard/domain/entities/user_info.dart';


void main() {
  final TshUserModel tshUserModel = TshUserModel(UserInfo(
      userNumber: 0,
      userData: null,
      permissions: null,
      roles: null,
      userDataLastSet: 0));

  final HomeParameters homeParameters =
      HomeParameters(myUserInfo: tshUserModel);

  test(
    'should be a subclass of HomeParameters entity',
    () async {
      // assert
      expect(homeParameters, isA<HomeParameters>());
    },
  );

  group("Test sending parameters", () {
    test("Should have all properties set properly ", () {
      final tempHomeParameters = HomeParameters(
          myUserInfo: TshUserModel(UserInfo(
              userNumber: 0,
              userData: null,
              permissions: null,
              roles: null,
              userDataLastSet: 0)));

      expect(tempHomeParameters.myUserInfo.userInfo.userNumber, 0);
      expect(tempHomeParameters.myUserInfo.userInfo.userData, null);
      expect(tempHomeParameters.myUserInfo.userInfo.permissions, null);
      expect(tempHomeParameters.myUserInfo.userInfo.roles, null);
      expect(tempHomeParameters.myUserInfo.userInfo.userDataLastSet, 0);
    });
  });
}
