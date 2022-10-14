import 'dart:convert';

import 'package:dartz/dartz.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/core/services/share_preferences_service.dart';
import 'package:tsh/core/util/input_converter.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/injection_container.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_platform_interface.dart';

import '../../fixtures/fixture_reader.dart';

class MockBuildContext extends Mock implements BuildContext {}

class MockSharedPreferencesService extends Mock
    implements SharedPreferencesService {}

class FakeSharedPreferencesStore implements SharedPreferencesStorePlatform {
  FakeSharedPreferencesStore(Map<String, Object> data)
      : backend = InMemorySharedPreferencesStore.withData(data);

  final InMemorySharedPreferencesStore backend;
  final List<MethodCall> log = <MethodCall>[];

  @override
  bool get isMock => true;

  @override
  Future<bool> clear() {
    log.add(MethodCall('clear'));
    return backend.clear();
  }

  @override
  Future<Map<String, Object>> getAll() {
    log.add(MethodCall('getAll'));
    return backend.getAll();
  }

  @override
  Future<bool> remove(String key) {
    log.add(MethodCall('remove', key));
    return backend.remove(key);
  }

  @override
  Future<bool> setValue(String valueType, String key, Object value) {
    log.add(MethodCall('setValue', <dynamic>[valueType, key, value]));
    return backend.setValue(valueType, key, value);
  }
}

main() {
  InputConverter inputConverter;
  FakeSharedPreferencesStore store;

  const Map<String, dynamic> kTestValues = <String, dynamic>{
    'flutter.String': 'hello world',
    'flutter.bool': true,
    'flutter.int': 42,
    'flutter.double': 3.14159,
    'flutter.List': <String>['foo', 'bar'],
  };
  setUp(() async {
    inputConverter = InputConverter();
    store = FakeSharedPreferencesStore(kTestValues);
    SharedPreferencesStorePlatform.instance = store;

    //make sure the instance is cleared before each test
    await GetIt.I.reset();
    store.log.clear();

    await init();
    sl<SharedPreferencesService>().setForceTime("2020-12-09T18:15:00.000Z");
  });

  test("Should convert a string to an int", () {
    int expectedResult = 3;
    final result = inputConverter.stringToUnsignedInteger("3");

    expect(result, equals(Right(expectedResult)));
  });
  test("Should throw an error as the string is not a valid int", () {
    final result = inputConverter.stringToUnsignedInteger("3.0.0");
    expect(result, equals(Left(InvalidInputFailure())));
  });
  group("Checke the different resolution ipad 12", () {
    double longSide = 1400;
    test(
        "Should return a valid value for ipad 12 inch in group view + landscape",
        () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, true);
      expect(result, 0.65);
    });

    test(
        "Should return a valid value for ipad 12 inch in group view + portrait",
        () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, false);
      expect(result, 0.6459);
    });
    test(
        "Should return a valid value for ipad 12 inch in spotlight + landscape",
        () {
      final result = inputConverter.dynamicRatio(longSide, 0, false, true);
      expect(result, 0.62);
    });
    test("Should return a valid value for ipad 12 inch in spotlight + portrait",
        () {
      final result = inputConverter.dynamicRatio(longSide, 0, false, false);
      expect(result, 0.62);
    });
  });

  group("Checke the different resolution ipad air and 11 inch", () {
    double longSide = 1180;
    test("Should return a valid value group view + landscape", () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, true);
      expect(result, 0.67);
    });

    test("Should return a valid value group view + portrait", () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, false);
      expect(result, 0.68);
    });
    test("Should return a valid value spotlight + landscape", () {
      final result = inputConverter.dynamicRatio(longSide, 0, false, true);
      expect(result, 0.615);
    });
    test("Should return a valid value  in spotlight + portrait", () {
      final result = inputConverter.dynamicRatio(longSide, 0, false, false);
      expect(result, 0.64);
    });
  });

  group("Checke the different resolution ipad 8th gen", () {
    double longSide = 1080;
    test("Should return a valid value group view + landscape", () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, true);
      expect(result, 0.6699);
    });

    test("Should return a valid value group view + portrait", () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, false);
      expect(result, 0.6799);
    });
    test("Should return a valid value spotlight + landscape", () {
      final result = inputConverter.dynamicRatio(longSide, 0, false, true);
      expect(result, 0.6699);
    });
    test("Should return a valid value  in spotlight + portrait", () {
      final result = inputConverter.dynamicRatio(longSide, 0, false, false);
      expect(result, 0.6799);
    });
  });

  group("Checke the different resolution ipad mini", () {
    double longSide = 768;
    test("Should return a valid value group view + landscape", () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, true);
      expect(result, 0.7);
    });

    test("Should return a valid value group view + portrait", () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, false);
      expect(result, 0.7);
    });
    test("Should return a valid value spotlight + landscape", () {
      final result = inputConverter.dynamicRatio(longSide, 0, false, true);
      expect(result, 0.6459);
    });
    test("Should return a valid value  in spotlight + portrait", () {
      final result = inputConverter.dynamicRatio(longSide, 0, false, false);
      expect(result, 0.6459);
    });
  });

  group("Checke the different resolution for other device not listed", () {
    double longSide = 400;
    test("Should return a valid value group view + landscape", () {
      final result = inputConverter.dynamicRatio(longSide, 0, true, true);
      expect(result, .6459);
    });
  });

  group("description", () {
    test(
        "Should return a valid json for a class to translate into session state with a forced time",
        () {
      sl<SharedPreferencesService>().setForceTime("2020-12-09T18:15:00.000Z");
      final Map<String, dynamic> jsonMap = json.decode(fixture('class.json'));
      final ClassesModel classModel = ClassesModel.fromJson(jsonMap);
      final sessionState = inputConverter.showSessionState(classModel);
      expect(sessionState['instructor'], "Chrisanne Bradley");
    });
    test(
        "Should return a valid json for a class to translate into session state with no forced time",
        () {
      sl<SharedPreferencesService>().setForceTime(null);
      final Map<String, dynamic> jsonMap = json.decode(fixture('class.json'));
      final ClassesModel classModel = ClassesModel.fromJson(jsonMap);
      final sessionState = inputConverter.showSessionState(classModel);
      expect(sessionState['instructor'], "Chrisanne Bradley");
    });
  });

  test("Should return the proper day from a short day format", () {
    expect(inputConverter.convertDay('mon'), "Monday");
    expect(inputConverter.convertDay('tue'), "Tuesday");
    expect(inputConverter.convertDay('wed'), "Wednesday");
    expect(inputConverter.convertDay('thu'), "Thursday");
    expect(inputConverter.convertDay('fri'), "Friday");
    expect(inputConverter.convertDay('sat'), "Saturday");
    expect(inputConverter.convertDay('sun'), "Sunday");
  });
}
