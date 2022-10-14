import 'package:dartz/dartz.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';

class GetClassInfoUsecase implements UseCase<ClassesModel, String> {
  final DashboardRepository dashboardRepository;

  GetClassInfoUsecase(this.dashboardRepository);
  @override
  Future<Either<Failure, ClassesModel>> call(
    String class1Acronym,
  ) async {
    return await dashboardRepository.getClassInfoRepository(
        class1Acronym: class1Acronym);
  }
}
