import 'package:flutter/material.dart';

class AppMetadata {
  String programs;

  AppMetadata({
    @required this.programs,
  });

  @override
  bool operator ==(other) {
    return (other is AppMetadata) && other.programs == programs;
  }
}
