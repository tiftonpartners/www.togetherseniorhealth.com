import 'package:tsh/features/dashboard/data/models/app_meta_data_model.dart';

import 'app_meta_data.dart';

class Instructor {
  String email;
  String name;
  String nickname;
  String picture;
  String userId;
  String username;
  AppMetadata appMetadata;

  Instructor(
      {this.email,
      this.name,
      this.nickname,
      this.picture,
      this.userId,
      this.username,
      this.appMetadata});

  Instructor.fromJson(Map<String, dynamic> json) {
    email = json['email'];
    name = json['name'];
    nickname = json['nickname'];
    picture = json['picture'];
    userId = json['user_id'];
    username = json['username'];
    appMetadata = json['app_metadata'] != null
        ? new AppMetadataModel.fromJson(json['app_metadata'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['email'] = this.email;
    data['name'] = this.name;
    data['nickname'] = this.nickname;
    data['picture'] = this.picture;
    data['user_id'] = this.userId;
    data['username'] = this.username;
    if (this.appMetadata != null) {
      data['app_metadata'] = (this.appMetadata as AppMetadataModel).toJson();
    }
    return data;
  }

  @override
  bool operator ==(other) {
    return (other is Instructor) &&
        other.email == email &&
        other.name == name &&
        other.nickname == nickname &&
        other.picture == picture &&
        other.userId == userId &&
        other.username == username &&
        other.appMetadata == appMetadata;
  }
}
