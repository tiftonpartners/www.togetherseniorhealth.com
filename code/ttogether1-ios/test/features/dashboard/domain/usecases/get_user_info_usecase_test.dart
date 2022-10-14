import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_user_info_usecase.dart';

class MockDashboardRepository extends Mock implements DashboardRepository {}

void main() {
  GetUserInfoUsecase useCase;
  MockDashboardRepository mockDashboardRepository;
  setUp(() {
    mockDashboardRepository = MockDashboardRepository();
    useCase = GetUserInfoUsecase(mockDashboardRepository);
  });

  final String user2Id = "asd123123";
  final bool isId = true;
  final TshUser tshUser = TshUser(userInfo: null);

  test("Should get the information of the user", () async {
    when(mockDashboardRepository.getUserInfoRepository(
            user2Id: user2Id, isId: isId))
        .thenAnswer((_) async => Right(tshUser));
    final result = await useCase.call(user2Id, isId: isId);
    expect(result, Right(tshUser));
    verify(mockDashboardRepository.getUserInfoRepository(
        user2Id: user2Id, isId: isId));
    verifyNoMoreInteractions(mockDashboardRepository);
  });
}