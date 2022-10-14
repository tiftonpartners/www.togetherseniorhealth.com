
import 'package:tsh/features/dashboard/domain/entities/app_meta_data.dart';
import 'package:flutter_test/flutter_test.dart';
main() {
  final appMetadata =
      AppMetadata(programs: "RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP");

  test(
    'should be a subclass of AppMetadata entity',
    () async {
      // assert
      expect(appMetadata, isA<AppMetadata>());
    },
  );

  test(
    'should have all properties set',
    () async {
      AppMetadata temp =
          AppMetadata(programs: "RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP");
      // assert
      expect(temp.programs, "RS,CC,MC,SUTP,STANP,OTHER,TEST,TRHCAP,BSCAP");
    },
  );
}
