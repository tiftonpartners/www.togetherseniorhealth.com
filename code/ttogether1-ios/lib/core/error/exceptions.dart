import 'package:flutter/foundation.dart';

class ServerException implements Exception {
  String message;
  ServerException({
    @required this.message,
  });
}