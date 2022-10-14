import 'package:dartz/dartz.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';

class CreateJwtAndSaveUsecase implements UseCase<String, String> {
  final DashboardRepository dashboardRepository;

  CreateJwtAndSaveUsecase(this.dashboardRepository);
  @override
  Future<Either<Failure, String>> call(String ticket,
      {String forceTime, bool shouldSave = true}) async {
    return await dashboardRepository.createJwtRepository(
        ticket: ticket, forceTime: forceTime, shouldSave: shouldSave);
  }
}
