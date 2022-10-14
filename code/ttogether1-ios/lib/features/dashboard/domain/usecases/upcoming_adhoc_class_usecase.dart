import 'package:dartz/dartz.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';

class UpcomingAdhocClassUsecase
    implements UseCase<List<ClassesModel>, NoParams> {
  final DashboardRepository dashboardRepository;

  UpcomingAdhocClassUsecase(this.dashboardRepository);
  @override
  Future<Either<Failure, List<ClassesModel>>> call(NoParams params) async {
    return await dashboardRepository.upcomingAdhocClassesRepository();
  }
}
