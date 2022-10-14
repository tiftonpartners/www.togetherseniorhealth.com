import 'package:flutter/material.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

class CallParameters {
  final AgoraModel agora;
  final List<TshUser> participantsList;
  final TshUser myUserInfo;
  final TshUser instructorInfo;
  final bool isInstructor;
  final bool isCheck;
  final ClassesModel classesModel;

  CallParameters(
      {@required this.agora,
      this.myUserInfo,
      this.classesModel,
      this.participantsList,
      this.isInstructor,
      this.isCheck = true,
      this.instructorInfo});
}
