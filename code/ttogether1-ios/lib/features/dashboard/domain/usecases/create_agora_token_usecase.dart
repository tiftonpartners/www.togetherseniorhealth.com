import 'package:dartz/dartz.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';

class CreateAgoraTokenUsecase implements UseCase<AgoraModel, String> {
  final DashboardRepository dashboardRepository;

  CreateAgoraTokenUsecase(this.dashboardRepository);
  @override
  Future<Either<Failure, AgoraModel>> call(String jwt) async {
    return await dashboardRepository.createAgoraTokenRepository(jwt: jwt);
  }
}
