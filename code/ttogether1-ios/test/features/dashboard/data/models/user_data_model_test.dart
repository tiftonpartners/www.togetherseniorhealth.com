import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/data/models/user_data_model.dart';
import 'package:tsh/features/dashboard/domain/entities/app_meta_data.dart';

import '../../../../fixtures/fixture_reader.dart';

void main() {
  final UserDataModel classModel = UserDataModel(
      null,
      "cbradley@togetherseniorhealth.com",
      null,
      null,
      "Chrisanne Bradley",
      "cbradley",
      "https://lh3.googleusercontent.com/a-/AOh14Ggx7QRKOE3SyxRLfOwwcnFycsw6hYdWTR_F7aE1=s96-c",
      null,
      "google-oauth2|113310272186624929173",
      null,
      AppMetadata(programs: "RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP"));

  test(
    'should be a subclass of UserDataModel entity',
    () async {
      // assert
      expect(classModel, isA<UserDataModel>());
    },
  );

  group("Test encode / decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('instructor.json'));
      final result = UserDataModel.fromJson(jsonMap);
      expect(result, classModel);
    });

    test("Should encode a valid JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('instructor.json'));
      // TODO: there's a bug with subchild objects
      classModel.appMetadata = null;
      final result = classModel.toJson();
      expect(result["email"], jsonMap["email"]);
      expect(result["name"], jsonMap["name"]);
      expect(result["nickname"], jsonMap["nickname"]);
      expect(result["picture"], jsonMap["picture"]);
      expect(result["user_id"], jsonMap["user_id"]);
    });
  });
}
