import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_jwt_usecase.dart';

class MockDashboardRepository extends Mock implements DashboardRepository {}

void main() {
  CreateJwtAndSaveUsecase useCase;
  MockDashboardRepository mockDashboardRepository;
  setUp(() {
    mockDashboardRepository = MockDashboardRepository();
    useCase = CreateJwtAndSaveUsecase(mockDashboardRepository);
  });

  final String ticket =
      "WkxU_s9YlsUAj_7_Yeyr9l6ws3HhsMGvVWyhWCl3-MbA9evbQ7Yp-i7slUGmwEvp";
  final String jwt = "randomJwtToken";

  test("Should get an Agora Token from a JWT", () async {
    when(mockDashboardRepository.createJwtRepository(
            ticket: ticket, forceTime: null, shouldSave: false))
        .thenAnswer((_) async {
      return Right(jwt);
    });
    final result =
        await useCase.call(ticket, forceTime: null, shouldSave: false);
    expect(result, Right(jwt));
    verify(mockDashboardRepository.createJwtRepository(
        ticket: ticket, forceTime: null, shouldSave: false));
    verifyNoMoreInteractions(mockDashboardRepository);
  });
}
