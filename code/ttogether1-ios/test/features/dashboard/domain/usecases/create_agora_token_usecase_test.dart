import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/create_agora_token_usecase.dart';

class MockDashboardRepository extends Mock implements DashboardRepository {}

void main() {
  CreateAgoraTokenUsecase useCase;
  MockDashboardRepository mockDashboardRepository;
  setUp(() {
    mockDashboardRepository = MockDashboardRepository();
    useCase = CreateAgoraTokenUsecase(mockDashboardRepository);
  });

  // Note : we have other properties but we don't care much in the app
  final AgoraModel agoraToken = AgoraModel(token: "eoidsoxc34343");
  final String jwt = "randomJwtToken";

  test("Should get an Agora Token from a JWT", () async {
    when(mockDashboardRepository.createAgoraTokenRepository(jwt: jwt))
        .thenAnswer((_) async => Right(agoraToken));
    final result = await useCase.call(jwt);
    expect(result, Right(agoraToken));
    verify(mockDashboardRepository.createAgoraTokenRepository(jwt: jwt));
    verifyNoMoreInteractions(mockDashboardRepository);
  });
}