import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:tsh/constants/constants.dart';
import 'package:tsh/constants/variable.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/core/services/auth0_service.dart';
import 'package:uni_links/uni_links.dart';
import 'package:appsflyer_sdk/appsflyer_sdk.dart';

part 'deep_link_state.dart';

class DeepLinkCubit extends Cubit<DeepLinkState> {
  // final AppsflyerSdk appsflyerSdk;
  final Auth0Service auth0service;
  AppsflyerSdk appsflyerSdk;

  StreamSubscription _sub;
  bool _initialUriIsHandled = false;

  DeepLinkCubit(
      // {@required this.appsflyerSdk}
      {
    @required this.auth0service,
  }) : super(DeepLinkInitial()) {
    appsflyerSdk = AppsflyerSdk(AppsFlyerOptions(
        afDevKey: Constants.APPSFLYER_DEV_KEY,
        appId: Constants.APPSFLYER_APP_ID,
        showDebug: true));
    _onAppsFlyer();
    _handleInitialUri();
    _sub = getUriLinksStream().listen((Uri uri) async {
      // get ticket from parameters
      onHandlerUniDeepLink(uri);
    });
    _sub.onError((handleError) {
      emit(DeepLinkError(failure: handleError));
    });
  }

  void _onAppsFlyer() {
    appsflyerSdk
        .initSdk(
      registerConversionDataCallback: true,
      registerOnAppOpenAttributionCallback: true,
      // registerOnDeepLinkingCallback: true,
    )
        .then((value) {
      // appsflyerSdk.onDeepLinkingStream.listen((event) {
      //   print("onDeepLinkingStream: $event");
      // });
      //!this happening, when open the link(app installed)
      appsflyerSdk.onAppOpenAttribution((event) {
        print("appOpenAttributionStream: $event");
        Map<String, dynamic> data = event['payload'];
        String link;
        String tshLink = data['link'];
        String forceTime =
            data['forceTime'] == null ? null : "forceTime=${data['forceTime']}";
        String ticket =
            data['ticket'] == null ? null : "ticket=${data['ticket']}";
        if (tshLink.substring(0, 3) == TSH) {
          link = tshLink;
        } else {
          if (ticket != null) {
            if (forceTime != null) {
              link = "$BASEURL_TSH?$ticket&$forceTime";
            } else {
              link = "$BASEURL_TSH?$ticket";
            }
          } else {
            if (forceTime != null) {
              link = "${data["af_dp"]}&$forceTime";
            } else {
              link = "${data["af_dp"]}";
            }
          }
        }
        print("myLink: $link");
        onHandlerUniDeepLink(Uri.parse(link));
      });
      //!this is working when comeback from install the app.
      appsflyerSdk.onInstallConversionData((event) {
        print("conversionDataStream: $event");
        Map<String, dynamic> data = event['payload'];
        bool firstLaunch = data["is_first_launch"];
        String deepLink = data["af_dp"];
        String forceTime =
            data['forceTime'] == null ? null : "forceTime=${data['forceTime']}";
        String ticket =
            data['ticket'] == null ? null : "ticket=${data['ticket']}";
        // Need to decode the deepLink
        String link;
        if (ticket != null) {
          if (forceTime != null) {
            link = "$BASEURL_TSH?$ticket&$forceTime";
          } else {
            link = "$BASEURL_TSH?$ticket";
          }
        } else {
          if (forceTime != null) {
            link = "$deepLink&$forceTime";
          } else {
            link = "$deepLink";
          }
        }
        if ((ticket != null || deepLink != null) && firstLaunch == true) {
          print("conversionDataStream > firstLaunch $firstLaunch");
          print("conversionDataStream > myLink: $link");
          onHandlerUniDeepLink(Uri.parse(link));
        }
      });
    }).catchError((err) {
      print("_onAppsFlyerDeepLink: $err");
    });
  }

  void onHandlerUniDeepLink(Uri uri) {
    if (uri == null) {
      return;
    }
    emit(DeepLinkLoading());
    auth0service.logoutAction();
    final queryParams = uri?.queryParametersAll;
    String baseUrl;

    if (uri?.scheme?.toLowerCase() == TSH.toLowerCase()) {
      baseUrl = "/" + (uri.host ?? "") + (uri.path ?? "");
    } else {
      baseUrl = (uri.path ?? "");
    }
    if (baseUrl.toLowerCase() == DEEPLINK_UPCOMING.toLowerCase()) {
      onDecodeTicket(queryParams);
    } else {
      emit(DeepLinkError(failure: ServerFailure("The URL path is invalid")));
    }
  }

  onDecodeTicket(Map<String, dynamic> queryParams, {bool isAppsflyer = false}) {
    String ticket;
    String forceTime;
    if (isAppsflyer) {
      auth0service.logoutAction();
      emit(DeepLinkLoading());
    }

    if (queryParams != null) {
      if (queryParams['ticket'] == null) {
        emit(DeepLinkError(failure: ServerFailure("The ticket is empty")));
      }
      ticket = isAppsflyer ? queryParams['ticket'] : queryParams['ticket'][0];
      forceTime =
          queryParams['forceTime'] == null ? null : queryParams['forceTime'][0];

      emit(DeepLinkLoaded(ticket, forceTime: forceTime));
    } else {
      ticket = "";
      emit(DeepLinkError(failure: ServerFailure("The ticket is invalid")));
    }
  }

  Future<void> _handleInitialUri() async {
    if (!_initialUriIsHandled) {
      _initialUriIsHandled = true;
      try {
        final uri = await getInitialUri();
        onHandlerUniDeepLink(uri);
      } on PlatformException {
        DeepLinkError(failure: ServerFailure('falied to get initial uri'));
      } on FormatException catch (err) {
        print('error: $err');
        DeepLinkError(failure: ServerFailure(err.message));
      }
    }
  }

  @override
  Future<void> close() {
    _sub?.cancel();
    return super.close();
  }
}
