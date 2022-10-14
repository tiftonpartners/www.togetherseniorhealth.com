import 'package:dartz/dartz.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';

class GetUserInfoUsecase implements UseCase<TshUser, String> {
  final DashboardRepository dashboardRepository;

  GetUserInfoUsecase(this.dashboardRepository);
  @override
  Future<Either<Failure, TshUser>> call(
    String user2Id, {
    bool isId,
  }) async {
    return await dashboardRepository.getUserInfoRepository(
        user2Id: user2Id, isId: isId);
  }
}
