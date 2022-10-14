import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import '../../../../core/usecases/usecase.dart';

class GetForceTimeUsecase implements UseCaseNoParams<String> {
  final DashboardRepository dashboardRepository;

  GetForceTimeUsecase(this.dashboardRepository);

  @override
  String call() {
    return dashboardRepository.getForceTime();
  }
}
