import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_secured_agora_token_usecase.dart';

class MockDashboardRepository extends Mock implements DashboardRepository {}

void main() {
  CreateSecuredAgoraTokenUsecase useCase;
  MockDashboardRepository mockDashboardRepository;
  setUp(() {
    mockDashboardRepository = MockDashboardRepository();
    useCase = CreateSecuredAgoraTokenUsecase(mockDashboardRepository);
  });

  final String acronym = "MTIOS1G1-211201";
  final AgoraModel agoraToken = AgoraModel(token: "eoidsoxc34343");

  test("Should get an Agora Token from an accronym", () async {
    when(mockDashboardRepository.createSecuredAgoraTokenRepository(
            accronym: acronym))
        .thenAnswer((_) async => Right(agoraToken));
    final result = await useCase.call(acronym);
    expect(result, Right(agoraToken));
    verify(mockDashboardRepository.createSecuredAgoraTokenRepository(
        accronym: acronym));
    verifyNoMoreInteractions(mockDashboardRepository);
  });
}
