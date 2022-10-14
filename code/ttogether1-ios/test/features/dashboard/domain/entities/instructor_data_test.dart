import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/domain/entities/app_meta_data.dart';
import 'package:tsh/features/dashboard/domain/entities/instructor_data.dart';

import '../../../../fixtures/fixture_reader.dart';

void main() {
  final instructorData = InstructorData(
    email: "cbradley@togetherseniorhealth.com",
    name: "Chrisanne Bradley",
    nickname: "cbradley",
    picture:
        "https://lh3.googleusercontent.com/a-/AOh14Ggx7QRKOE3SyxRLfOwwcnFycsw6hYdWTR_F7aE1=s96-c",
    userId: "google-oauth2|113310272186624929173",
    appMetadata:
        AppMetadata(programs: "RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP"),
  );

  test(
    'should be a subclass of InstructorData entity',
    () async {
      // assert
      expect(instructorData, isA<InstructorData>());
    },
  );

  group("Test decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('instructor.json'));
      final result = InstructorData.fromJson(jsonMap);
      expect(result, instructorData);
    });
  });
}
