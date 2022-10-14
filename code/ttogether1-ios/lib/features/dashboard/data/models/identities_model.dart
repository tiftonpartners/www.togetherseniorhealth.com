import 'package:tsh/features/dashboard/domain/entities/identities.dart';

class IdentitiesModel extends Identities {
  IdentitiesModel(
    String connection,
    String userId,
    String provider,
    bool isSocial,
  ) : super(
          connection: connection,
          isSocial: isSocial,
          provider: provider,
          userId: userId,
        );
  IdentitiesModel.fromJson(Map<String, dynamic> json) {
    connection = json['connection'];
    userId = json['user_id'];
    provider = json['provider'];
    isSocial = json['isSocial'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['connection'] = this.connection;
    data['user_id'] = this.userId;
    data['provider'] = this.provider;
    data['isSocial'] = this.isSocial;
    return data;
  }

  @override
  bool operator ==(other) {
    return (other is IdentitiesModel) &&
        other.connection == connection &&
        other.userId == userId &&
        other.provider == provider &&
        other.isSocial == isSocial;
  }
}
