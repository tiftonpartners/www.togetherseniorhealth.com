import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/upcoming_classes_usecase.dart';

class MockDashboardRepository extends Mock implements DashboardRepository {}

void main() {
  UpcomingClassesUsecase useCase;
  MockDashboardRepository mockDashboardRepository;
  setUp(() {
    mockDashboardRepository = MockDashboardRepository();
    useCase = UpcomingClassesUsecase(mockDashboardRepository);
  });

  final forceTime = "2021-12-01T19:00:00.000Z";
  final ClassesModel classesModel1 = ClassesModel(sId: "TSH-001");
  final ClassesModel classesModel2 = ClassesModel(sId: "TSH-002");
  final List<ClassesModel> classesList = [classesModel1, classesModel2];

  test("Should get the information of the user", () async {
    when(mockDashboardRepository.upcomingClassesRepository(
            forceTime: forceTime))
        .thenAnswer((_) async => Right(classesList));

    final result = await useCase.call(forceTime);
    List<ClassesModel> c1 = result.fold((l) => null, (r) => r);
    expect(c1.length, classesList.length);
    expect(c1[0].sId, classesList[0].sId);
    expect(c1[1].sId, classesList[1].sId);
    verify(mockDashboardRepository.upcomingClassesRepository(
        forceTime: forceTime));
    verifyNoMoreInteractions(mockDashboardRepository);
  });
}
