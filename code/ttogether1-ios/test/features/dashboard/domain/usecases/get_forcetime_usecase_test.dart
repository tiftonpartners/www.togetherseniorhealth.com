import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_forcetime_usecase.dart';

class MockDashboardRepository extends Mock implements DashboardRepository {}

void main() {
  GetForceTimeUsecase useCase;
  MockDashboardRepository mockDashboardRepository;
  setUp(() {
    mockDashboardRepository = MockDashboardRepository();
    useCase = GetForceTimeUsecase(mockDashboardRepository);
  });

  final String forceTime = "2021-12-01T19:00:00.000Z";

  test("Should get the forced time value", () async {
    when(mockDashboardRepository.getForceTime()).thenAnswer((_) => forceTime);
    final result = useCase.call();
    expect(result, forceTime);
    verify(mockDashboardRepository.getForceTime());
    verifyNoMoreInteractions(mockDashboardRepository);
  });
}
