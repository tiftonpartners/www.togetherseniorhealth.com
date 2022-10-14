import 'package:flutter/material.dart';
import 'package:tsh/core/services/share_preferences_service.dart';

class Auth0Config {
  // static const AUTH0_DOMAIN = 'af-dev-tsh.us.auth0.com';
  // static const AUTH0_CLIENT_ID = 'tx8VwPVBiGNbW4EhX7mR22o30KKskNc2';
  static const AUTH0_DOMAIN = 'mt1-test.us.auth0.com';
  static const AUTH0_CLIENT_ID = 'mzN69Zu5jQpDYdf8rzbDMCwt0l4JeBPB';

  static const AUTH0_REDIRECT_URI =
      'com.dev.app.tsh://login-callback'; // Allowed Callback URLs
  static const AUTH0_ISSUER = 'https://$AUTH0_DOMAIN';
}

class Auth0Service {
  final SharedPreferencesService sharedPreferencesService;

  Auth0Service({@required this.sharedPreferencesService});

  Future<void> logoutAction() async {
    await sharedPreferencesService.reset();
  }
}
