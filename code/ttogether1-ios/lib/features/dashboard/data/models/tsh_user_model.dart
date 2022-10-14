import 'package:tsh/features/dashboard/data/models/user_info_model.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';
import 'package:tsh/features/dashboard/domain/entities/user_info.dart';

class TshUserModel extends TshUser {
  TshUserModel(UserInfo userInfo) : super(userInfo: userInfo);
  TshUserModel.fromJson(Map<String, dynamic> json) {
    userInfo = json['userInfo'] != null
        ? new UserInfoModel.fromJson(json['userInfo'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.userInfo != null) {
      data['userInfo'] = (this.userInfo as UserInfoModel).toJson();
    }
    return data;
  }

  @override
  bool operator ==(other) {
    return (other is TshUserModel) &&
        other.userInfo == userInfo;
  }
}
