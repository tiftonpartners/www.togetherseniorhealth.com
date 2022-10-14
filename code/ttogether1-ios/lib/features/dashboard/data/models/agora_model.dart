import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/domain/entities/agora.dart';
import 'package:tsh/features/dashboard/domain/entities/session.dart';

class AgoraModel extends Agora {
  AgoraModel({
    String token,
    GenericSession sessionModel,
    int userNumber,
  }) : super(
          userNumber: userNumber,
          session: sessionModel,
          token: token,
        );

  factory AgoraModel.fromJson(Map<String, dynamic> json) {
    return AgoraModel(
        token: json['token'],
        sessionModel: json['session'] != null
            ? new SessionModel.fromJson(json['session'])
            : null,
        userNumber: json['userNumber']);
  }

  Map<String, dynamic> toJson() => {
        'token': token,
        'session': session.toJson(),
        'userNumber': userNumber,
      };

  @override
  bool operator ==(other) {
    return (other is AgoraModel) &&
        other.token == token &&
        other.userNumber == userNumber &&
        other.session == session;
  }
}
