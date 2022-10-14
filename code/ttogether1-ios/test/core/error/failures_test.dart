import 'package:equatable/equatable.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/core/error/failures.dart';

main() {
  test("Test the ServerFailure object", () {
    ServerFailure failure1 = ServerFailure("failure 1");
    ServerFailure failure2 = ServerFailure("failure 1");
    expect(failure1, equals(failure2));
  });
  test("Test the CacheFailure object", () {
    CacheFailure failure1 = CacheFailure("failure 1");
    CacheFailure failure2 = CacheFailure("failure 1");
    expect(failure1, equals(failure2));
  });
}

// abstract class Failure extends Equatable {
//   @override
//   List<Object> get props => [];
// }

// // General failures
// class ServerFailure extends Failure {
//   final String messsage;

//   ServerFailure(this.messsage);
//   @override
//   List<Object> get props => [messsage];
// }

// class CacheFailure extends Failure {
//   final String messsage;

//   CacheFailure(this.messsage);
//   @override
//   List<Object> get props => [messsage];
// }
