import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  @override
  List<Object> get props => [];
}

// General failures
class ServerFailure extends Failure {
  final String messsage;

  ServerFailure(this.messsage);
  @override
  List<Object> get props => [messsage];
}

class CacheFailure extends Failure {
  final String messsage;

  CacheFailure(this.messsage);
  @override
  List<Object> get props => [messsage];
}
