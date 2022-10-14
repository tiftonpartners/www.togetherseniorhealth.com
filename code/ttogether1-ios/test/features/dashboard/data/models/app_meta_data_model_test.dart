import 'package:tsh/features/dashboard/data/models/app_meta_data_model.dart';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import '../../../../fixtures/fixture_reader.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final AppMetadataModel agoraToken =
      AppMetadataModel("RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP");
  test(
    'should be a subclass of App Meta Datas entity',
    () async {
      // assert
      expect(agoraToken, isA<AppMetadataModel>());
    },
  );

  group("Test encode / decode json", () {
    test("Should return a valid model when reading a JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('appmetadatas.json'));
      final result = AppMetadataModel.fromJson(jsonMap);
      expect(result, agoraToken);
    });

    test("Should encode a valid JSON", () {
      final Map<String, dynamic> jsonMap =
          json.decode(fixture('appmetadatas.json'));
      final result = agoraToken.toJson();
      expect(result["programs"], jsonMap["programs"]);
    });
  });
}
