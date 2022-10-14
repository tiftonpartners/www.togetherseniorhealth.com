import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/core/usecases/usecase.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/upcoming_adhoc_class_usecase.dart';

class MockDashboardRepository extends Mock implements DashboardRepository {}

void main() {
  UpcomingAdhocClassUsecase useCase;
  MockDashboardRepository mockDashboardRepository;
  setUp(() {
    mockDashboardRepository = MockDashboardRepository();
    useCase = UpcomingAdhocClassUsecase(mockDashboardRepository);
  });

  final ClassesModel classesModel1 = ClassesModel(sId: "TSH-001");
  final ClassesModel classesModel2 = ClassesModel(sId: "TSH-002");
  final List<ClassesModel> classesList = [classesModel1, classesModel2];

  test("Should get the information of the user", () async {
    when(mockDashboardRepository.upcomingAdhocClassesRepository())
        .thenAnswer((_) async => Right(classesList));

    final result = await useCase.call(NoParams());
    List<ClassesModel> c1 = result.fold((l) => null, (r) => r);
    expect(c1.length, classesList.length);
    expect(c1[0].sId, classesList[0].sId);
    expect(c1[1].sId, classesList[1].sId);
    verify(mockDashboardRepository.upcomingAdhocClassesRepository());
    verifyNoMoreInteractions(mockDashboardRepository);
  });
}
