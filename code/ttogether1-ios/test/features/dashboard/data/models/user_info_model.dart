import 'package:tsh/features/dashboard/data/models/user_data_model.dart';
import 'package:tsh/features/dashboard/domain/entities/user_data.dart';
import 'package:tsh/features/dashboard/domain/entities/user_info.dart';

class UserInfoModel extends UserInfo {
  UserInfoModel(int userNumber, String token, UserData userData, permissions,
      roles, int userDataLastSet)
      : super(
          permissions: permissions,
          roles: roles,
          userData: userData,
          userNumber: userNumber,
          userDataLastSet: userDataLastSet,
        );
  UserInfoModel.fromJson(Map<String, dynamic> json) {
    userNumber = json['userNumber'];
    userData = json['userData'] != null
        ? new UserDataModel.fromJson(json['userData'])
        : null;
    permissions = json['permissions'];
    roles = json['roles'];
    userDataLastSet = json['userDataLastSet'];
  }
  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['userNumber'] = this.userNumber;
    if (this.userData != null) {
      data['userData'] = (this.userData as UserDataModel).toJson();
    }
    data['permissions'] = this.permissions;
    data['roles'] = this.roles;
    data['userDataLastSet'] = this.userDataLastSet;
    return data;
  }
}
