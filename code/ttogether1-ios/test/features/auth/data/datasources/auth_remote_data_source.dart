
import 'package:meta/meta.dart';
import 'package:tsh/core/network/network_call.dart';
import 'package:tsh/core/services/share_preferences_service.dart';

abstract class AuthRemoteDataSource {
}


class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final NetworkCall networkCall;
  final SharedPreferencesService sharedPreferencesService;
  AuthRemoteDataSourceImpl({
    @required this.networkCall,
    @required this.sharedPreferencesService,
  });
}
