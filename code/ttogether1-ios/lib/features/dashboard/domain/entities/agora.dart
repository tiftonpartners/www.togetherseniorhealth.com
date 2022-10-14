import 'package:tsh/features/dashboard/data/models/session_model.dart';

class Agora {
  final String token;
  SessionModel session;
  final int userNumber;

  Agora({this.token, this.session, this.userNumber});
}
