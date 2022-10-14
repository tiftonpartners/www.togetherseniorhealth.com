import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:tsh/features/dashboard/domain/usecases/get_class_info_usecase.dart';

class MockDashboardRepository extends Mock implements DashboardRepository {}

void main() {
  GetClassInfoUsecase useCase;
  MockDashboardRepository mockDashboardRepository;
  setUp(() {
    mockDashboardRepository = MockDashboardRepository();
    useCase = GetClassInfoUsecase(mockDashboardRepository);
  });

  final String acronym = "MTIOS1G1-211201";
  final ClassesModel classModel =
      ClassesModel(sId: "12345", acronym: "MTIOS1G1-211201");

  test("Should get class info from the class acronym", () async {
    when(mockDashboardRepository.getClassInfoRepository(class1Acronym: acronym))
        .thenAnswer((_) async => Right(classModel));
    final result = await useCase.call(acronym);
    expect(result, Right(classModel));
    verify(
        mockDashboardRepository.getClassInfoRepository(class1Acronym: acronym));
    verifyNoMoreInteractions(mockDashboardRepository);
  });
}

// class GetClassInfoUsecase implements UseCase<ClassesModel, String> {
//   final DashboardRepository dashboardRepository;

//   GetClassInfoUsecase(this.dashboardRepository);
//   @override
//   Future<Either<Failure, ClassesModel>> call(
//     String class1Acronym,
//   ) async {
//     return await dashboardRepository.getClassInfoRepository(
//         class1Acronym: class1Acronym);
//   }
// }
