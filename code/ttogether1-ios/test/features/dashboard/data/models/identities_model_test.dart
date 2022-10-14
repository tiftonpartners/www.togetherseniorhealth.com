import 'package:tsh/features/dashboard/data/models/identities_model.dart';
import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final IdentitiesModel identitiesModel = IdentitiesModel(
      "Username-Password-Authentication",
      "6063865c77b322006822b2d0",
      "auth0",
      false);
  test(
    'should be a subclass of IdentitiesModel entity',
    () async {
      // assert
      expect(identitiesModel, isA<IdentitiesModel>());
    },
  );

  group("Test encode / decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('identities.json'));
      final result = IdentitiesModel.fromJson(jsonMap);
      expect(result, identitiesModel);
    });

    test("Should encode a valid JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('identities.json'));
      final result = identitiesModel.toJson();
      expect(result["user_id"], jsonMap["user_id"]);
      expect(result["provider"], jsonMap["provider"]);
      expect(result["connection"], jsonMap["connection"]);
      expect(result["isSocial"], jsonMap["isSocial"]);
    });
  });
}
