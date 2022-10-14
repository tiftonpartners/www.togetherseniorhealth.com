import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/core/usecases/usecase.dart';

main() {
  test("Test the NoParams object", () {
    NoParams noParams1 = NoParams();
    NoParams noParams2 = NoParams();
    expect(noParams1, equals(noParams2));
  });
}