import 'package:tsh/features/dashboard/data/models/app_meta_data_model.dart';

import 'app_meta_data.dart';

class InstructorData {
  String createdAt;
  String email;
  bool emailVerified;
  String name;
  String nickname;
  String picture;
  String updatedAt;
  String userId;
  String username;
  String lastLogin;
  String lastIp;
  int loginsCount;
  AppMetadata appMetadata;

  InstructorData(
      {this.createdAt,
      this.email,
      this.emailVerified,
      this.name,
      this.nickname,
      this.picture,
      this.updatedAt,
      this.userId,
      this.username,
      this.lastLogin,
      this.lastIp,
      this.loginsCount,
      this.appMetadata});

  InstructorData.fromJson(Map<String, dynamic> json) {
    createdAt = json['created_at'];
    email = json['email'];
    emailVerified = json['email_verified'];
    name = json['name'];
    nickname = json['nickname'];
    picture = json['picture'];
    updatedAt = json['updated_at'];
    userId = json['user_id'];
    username = json['username'];
    lastLogin = json['last_login'];
    lastIp = json['last_ip'];
    loginsCount = json['logins_count'];
    appMetadata = json['app_metadata'] != null
        ? new AppMetadataModel.fromJson(json['app_metadata'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['created_at'] = this.createdAt;
    data['email'] = this.email;
    data['email_verified'] = this.emailVerified;
    data['name'] = this.name;
    data['nickname'] = this.nickname;
    data['picture'] = this.picture;
    data['updated_at'] = this.updatedAt;
    data['user_id'] = this.userId;
    data['username'] = this.username;
    data['last_login'] = this.lastLogin;
    data['last_ip'] = this.lastIp;
    data['logins_count'] = this.loginsCount;
    if (this.appMetadata != null) {
      data['app_metadata'] = (this.appMetadata as AppMetadataModel).toJson();
    }
    return data;
  }

  @override
  bool operator ==(other) {
    return (other is InstructorData) &&
        other.createdAt == createdAt &&
        other.email == email &&
        other.emailVerified == emailVerified &&
        other.name == name &&
        other.nickname == nickname &&
        other.picture == picture &&
        other.updatedAt == updatedAt &&
        other.userId == userId &&
        other.username == username &&
        other.lastLogin == lastLogin &&
        other.lastIp == lastIp &&
        other.loginsCount == loginsCount &&
        other.appMetadata == appMetadata;
  }
}
