import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/domain/entities/start_time.dart';

import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final StartTime classModel =
      StartTime(hour: 10, mins: 0, tz: "America/Los_Angeles");

  test(
    'should be a subclass of StartTime entity',
    () async {
      // assert
      expect(classModel, isA<StartTime>());
    },
  );

  group("Test decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('starttime.json'));
      final result = StartTime.fromJson(jsonMap);
      expect(result, classModel);
    });
  });
}
