import 'dart:convert';

import 'package:tsh/features/dashboard/data/models/tsh_user_model.dart';
import 'package:tsh/features/dashboard/data/models/user_info_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/features/dashboard/domain/entities/user_info.dart';

import 'package:flutter_test/flutter_test.dart';
import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final TshUserModel userModel = TshUserModel(UserInfo(
      userNumber: 0,
      userData: null,
      permissions: null,
      roles: null,
      userDataLastSet: 0));

  test(
    'should be a subclass of TshUserModel entity',
    () async {
      // assert
      expect(userModel, isA<TshUserModel>());
    },
  );

  group("Test encode / decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('userinfo.json'));
      final result = TshUserModel.fromJson(jsonMap);
      expect(result, userModel);
    });

    // TODO : to come back later
    // test("Should encode a valid JSON", () {
    //   final Map<String, dynamic> jsonMap =
    //       json.decode(fixture('userinfo.json'));
    //   final result = userModel.toJson();
    //   expect(result["userInfo"]["userNumber"], jsonMap["userInfo"]["userNumber"]);
    //   expect(result["userInfo"]["userData"], jsonMap["userInfo"]["userData"]);
    //   expect(result["userInfo"]["permissions"], jsonMap["userInfo"]["permissions"]);
    //   expect(result["userInfo"]["roles"], jsonMap["userInfo"]["roles"]);
    //   expect(result["userInfo"]["userDataLastSet"], jsonMap["userInfo"]["userDataLastSet"]);
    // });
  });
}
