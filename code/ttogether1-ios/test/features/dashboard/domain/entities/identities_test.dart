import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/domain/entities/identities.dart';

void main() {
  final Identities classModel = Identities(
      connection: "Username-Password-Authentication",
      userId: "6063865c77b322006822b2d0",
      provider: "auth0",
      isSocial: false);

  test(
    'should be a subclass of Identities entity',
    () async {
      // assert
      expect(classModel, isA<Identities>());
    },
  );
}
