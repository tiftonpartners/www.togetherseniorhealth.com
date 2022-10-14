import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/data/models/app_meta_data_model.dart';
import 'package:tsh/features/dashboard/domain/entities/instructor.dart';
import 'package:tsh/features/dashboard/domain/entities/instructor_data.dart';

import '../../../../fixtures/fixture_reader.dart';
import 'app_meta_data.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final Instructor classModel = Instructor(
    email: "cbradley@togetherseniorhealth.com",
    name: "Chrisanne Bradley",
    nickname: "cbradley",
    picture:
        "https://lh3.googleusercontent.com/a-/AOh14Ggx7QRKOE3SyxRLfOwwcnFycsw6hYdWTR_F7aE1=s96-c",
    userId: "google-oauth2|113310272186624929173",
    appMetadata:
        AppMetadataModel("RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP"),
  );

  test(
    'should be a subclass of Instructor entity',
    () async {
      // assert
      expect(classModel, isA<Instructor>());
    },
  );

  group("Test decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap = json.decode(fixture('instructor.json'));
      final result = Instructor.fromJson(jsonMap);
      expect(result, classModel);
    });
  });
}
