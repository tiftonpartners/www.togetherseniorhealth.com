import 'package:dartz/dartz.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';

class UpcomingClassesUsecase implements UseCase<List<ClassesModel>, String> {
  final DashboardRepository dashboardRepository;

  UpcomingClassesUsecase(this.dashboardRepository);
  @override
  Future<Either<Failure, List<ClassesModel>>> call(String forceTime) async {
    return await dashboardRepository.upcomingClassesRepository(
        forceTime: forceTime);
  }
}
