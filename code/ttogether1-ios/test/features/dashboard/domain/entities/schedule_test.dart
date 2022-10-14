import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/domain/entities/schedule.dart';
import 'package:tsh/features/dashboard/domain/entities/start_time.dart';

import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final Schedule classModel = Schedule(
      startTime: StartTime(hour: 10, mins: 0, tz: "America/Los_Angeles"),
      weekdays: ["tue", "thu"],
      sId: "604968a2bee4b21396fce72f");

  test(
    'should be a subclass of Schedule entity',
    () async {
      // assert
      expect(classModel, isA<Schedule>());
    },
  );

  group("Test decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('schedule.json'));
      final result = Schedule.fromJson(jsonMap);
      expect(result, classModel);
    });
  });
}
