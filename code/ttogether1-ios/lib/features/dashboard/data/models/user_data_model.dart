import 'package:tsh/features/dashboard/data/models/app_meta_data_model.dart';
import 'package:tsh/features/dashboard/domain/entities/app_meta_data.dart';
import 'package:tsh/features/dashboard/domain/entities/identities.dart';
import 'package:tsh/features/dashboard/domain/entities/user_data.dart';

class UserDataModel extends UserData {
  UserDataModel(
      String createdAt,
      String email,
      bool emailVerified,
      List<Identities> identities,
      String name,
      String nickname,
      String picture,
      String updatedAt,
      String userId,
      String username,
      AppMetadata appMetadata)
      : super(
          appMetadata: appMetadata,
          createdAt: createdAt,
          email: email,
          emailVerified: emailVerified,
          identities: identities,
          name: name,
          nickname: nickname,
          picture: picture,
          updatedAt: updatedAt,
          userId: userId,
          username: username,
        );

  UserDataModel.fromJson(Map<String, dynamic> json) {
    createdAt = json['created_at'];
    email = json['email'];
    emailVerified = json['email_verified'];
    if (json['identities'] != null) {
      identities = new List<Identities>();
      json['identities'].forEach((v) {
        identities.add(new Identities.fromJson(v));
      });
    }
    name = json['name'];
    nickname = json['nickname'];
    picture = json['picture'];
    updatedAt = json['updated_at'];
    userId = json['user_id'];
    username = json['username'];
    appMetadata = json['app_metadata'] != null
        ? new AppMetadataModel.fromJson(json['app_metadata'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['created_at'] = this.createdAt;
    data['email'] = this.email;
    data['email_verified'] = this.emailVerified;
    if (this.identities != null) {
      data['identities'] = this.identities.map((v) => (v.toJson())).toList();
    }
    data['name'] = this.name;
    data['nickname'] = this.nickname;
    data['picture'] = this.picture;
    data['updated_at'] = this.updatedAt;
    data['user_id'] = this.userId;
    data['username'] = this.username;
    if (this.appMetadata != null) {
      data['app_metadata'] = (this.appMetadata as AppMetadataModel).toJson();
    }
    return data;
  }

  @override
  bool operator ==(other) {
    return (other is UserDataModel) && 
    other.createdAt == createdAt && 
    other.email == email && 
    other.emailVerified == emailVerified && 
    other.identities == identities && 
    other.name == name && 
    other.nickname == nickname && 
    other.picture == picture && 
    other.updatedAt == updatedAt && 
    other.userId == userId && 
    other.username == username && 
    other.appMetadata == appMetadata;
  }
}
