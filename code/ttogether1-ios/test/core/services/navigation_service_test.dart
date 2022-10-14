import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/core/services/navigation_service.dart';

class MockBuildContext extends Mock implements BuildContext {}

class MockNavigationService extends Mock implements NavigationService {}

void main() {
  MockNavigationService mockNavigationService;
  MockBuildContext mockContext;
  setUp(() {
    mockNavigationService = MockNavigationService();
    mockContext = MockBuildContext();
  });

}
/*
class NavigationService {
  final GlobalKey<NavigatorState> navigatorKey =
      new GlobalKey<NavigatorState>();
  void navigateTo(String routeName, {dynamic params}) {
    navigatorKey.currentState.pushNamed(routeName, arguments: params);
  }

  void goBack() {
    navigatorKey.currentState.pop();
  }

  void goBackUntil(String routeName) {
    navigatorKey.currentState.popUntil(ModalRoute.withName(routeName));
  }

  Future<void> pushReplace(String routeName) async {
    return await navigatorKey.currentState.pushReplacementNamed(routeName);
  }

  void pushAndRemoveUntil(String routeName, {dynamic params}) {
    navigatorKey.currentState.pushNamedAndRemoveUntil(
        routeName, (route) => false,
        arguments: params);
  }
}
*/
