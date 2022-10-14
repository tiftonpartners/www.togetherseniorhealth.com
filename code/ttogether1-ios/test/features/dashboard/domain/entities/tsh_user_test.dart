import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'dart:convert';
import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final TshUser tshUser = TshUser(userInfo: null);

  test(
    'should be a subclass of TshUser entity',
    () async {
      // assert
      expect(tshUser, isA<TshUser>());
    },
  );
}
