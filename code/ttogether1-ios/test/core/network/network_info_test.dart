import 'dart:async';

import 'package:data_connection_checker/data_connection_checker.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/core/network/network_info.dart';

main() {
  DataConnectionChecker dataChecker;
  NetworkInfoImpl networkInfo;

  setUp(() {
    dataChecker = DataConnectionChecker();
    networkInfo = NetworkInfoImpl(dataChecker);
  });

  test("Test properties for network info", () async {
    bool isConnected = await networkInfo.isConnected;
    expect(isConnected, true);
  });
}
