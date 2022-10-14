import 'package:dartz/dartz.dart';
import 'package:meta/meta.dart';
import 'package:tsh/core/error/exceptions.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

import '../../domain/repositories/dashboard_repository.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final DashboardRemoteDataSource dashboardRemoteDataSource;

  DashboardRepositoryImpl({@required this.dashboardRemoteDataSource});

  @override
  Future<Either<Failure, AgoraModel>> createAgoraTokenRepository(
      {String jwt}) async {
    try {
      AgoraModel response =
          await dashboardRemoteDataSource.createAgoraToken(jwt: jwt);
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, AgoraModel>> createSecuredAgoraTokenRepository(
      {String accronym}) async {
    try {
      AgoraModel response = await dashboardRemoteDataSource
          .createSecuredAgoraToken(accronym: accronym);
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, String>> createJwtRepository(
      {String ticket, String forceTime, bool shouldSave}) async {
    try {
      String response = await dashboardRemoteDataSource.createJwt(
          ticket: ticket, forceTime: forceTime, shouldSave: shouldSave);
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  String getForceTime() {
    String forceTime = dashboardRemoteDataSource.getForceTime();
    return forceTime;
  }

  @override
  Future<Either<Failure, ClassesModel>> getClassInfoRepository(
      {String class1Acronym}) async {
    try {
      ClassesModel response = await dashboardRemoteDataSource.getClassInfo(
          class1Acronym: class1Acronym);
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, TshUser>> getUserInfoRepository({
    String user2Id,
    bool isId,
  }) async {
    try {
      TshUser response = await dashboardRemoteDataSource.getUserInfo(
        user2Id: user2Id,
        isId: isId,
      );
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, List<ClassesModel>>> upcomingClassesRepository(
      {String forceTime}) async {
    try {
      List<ClassesModel> response =
          await dashboardRemoteDataSource.upcomingClasses(forceTime: forceTime);
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }

  @override
  Future<Either<Failure, List<ClassesModel>>>
      upcomingAdhocClassesRepository() async {
    try {
      List<ClassesModel> response =
          await dashboardRemoteDataSource.upcomingAdhocClasses();
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    }
  }
}
