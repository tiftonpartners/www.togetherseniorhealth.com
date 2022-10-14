import 'package:dartz/dartz.dart';
import 'package:flutter/foundation.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

abstract class DashboardRepository {
  Future<Either<Failure, String>> createJwtRepository({
    @required String ticket,
    bool shouldSave,
    String forceTime,
  });
  Future<Either<Failure, AgoraModel>> createAgoraTokenRepository({
    @required String jwt,
  });
  Future<Either<Failure, AgoraModel>> createSecuredAgoraTokenRepository({
    @required String accronym,
  });
  Future<Either<Failure, List<ClassesModel>>> upcomingClassesRepository({
    @required String forceTime,
  });
  Future<Either<Failure, List<ClassesModel>>> upcomingAdhocClassesRepository();
  Future<Either<Failure, ClassesModel>> getClassInfoRepository({
    @required String class1Acronym,
  });
  Future<Either<Failure, TshUser>> getUserInfoRepository({
    @required String user2Id,
    bool isId,
  });

  String getForceTime();
}
