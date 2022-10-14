import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/domain/entities/user_info.dart';

void main() {
  // final tNumberTriviaModel = NumberTriviaModel(number: 1, text: 'Test Text');
  final UserInfo userInfo = UserInfo(
      userNumber: 0,
      userData: null,
      permissions: null,
      roles: null,
      userDataLastSet: 0);

  test(
    'should be a subclass of TshUser entity',
    () async {
      // assert
      expect(userInfo, isA<UserInfo>());
    },
  );
}
