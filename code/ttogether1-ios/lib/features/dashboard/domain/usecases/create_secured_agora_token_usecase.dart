import 'package:dartz/dartz.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';

class CreateSecuredAgoraTokenUsecase implements UseCase<AgoraModel, String> {
  final DashboardRepository dashboardRepository;

  CreateSecuredAgoraTokenUsecase(this.dashboardRepository);
  @override
  Future<Either<Failure, AgoraModel>> call(String accronym) async {
    return await dashboardRepository.createSecuredAgoraTokenRepository(
        accronym: accronym);
  }
}
