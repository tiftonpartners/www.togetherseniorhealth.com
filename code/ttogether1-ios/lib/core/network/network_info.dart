import 'dart:async';

import 'package:data_connection_checker/data_connection_checker.dart';
import 'package:flutter/material.dart';

abstract class NetworkInfo {
  Future<bool> get isConnected;
  StreamSubscription<DataConnectionStatus> streamInternetCalling({
    @required Function onDisconnect,
    @required Function onConnect,
    @required Function onSetState,
  });
  Stream<DataConnectionStatus> get streamInternetConnection;
}

class NetworkInfoImpl implements NetworkInfo {
  final DataConnectionChecker connectionChecker;
  bool _networkOn = true;

  NetworkInfoImpl(this.connectionChecker);

  @override
  Future<bool> get isConnected => connectionChecker.hasConnection;

  @override
  Stream<DataConnectionStatus> get streamInternetConnection =>
      connectionChecker.onStatusChange;

  @override
  StreamSubscription<DataConnectionStatus> streamInternetCalling({
    @required Function onDisconnect,
    @required Function onConnect,
    @required Function onSetState,
  }) {
    return connectionChecker.onStatusChange.listen((event) {
      if (event.index == 0) {
        _networkOn = false;
        onDisconnect();
      } else {
        if (!_networkOn) {
          onConnect();
        }
        _networkOn = true;
        onSetState();
      }
    });
  }
}
