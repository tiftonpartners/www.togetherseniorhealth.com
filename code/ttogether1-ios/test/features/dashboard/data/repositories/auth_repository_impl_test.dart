import 'package:collection/collection.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:tsh/core/error/failures.dart';
import 'package:tsh/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/classes_model.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/data/models/user_data_model.dart';
import 'package:tsh/features/dashboard/data/models/user_info_model.dart';
import 'package:tsh/features/dashboard/data/repositories/auth_repository_impl.dart';
import 'package:tsh/features/dashboard/domain/entities/tsh_user.dart';

class MockDashboardRemoteDataSource extends Mock
    implements DashboardRemoteDataSource {}

void main() {
  MockDashboardRemoteDataSource mockDashboardRemoteDataSource;
  DashboardRepositoryImpl dashboardRepositoryImpl;

  final AgoraModel agoraModel = AgoraModel(
      token:
          "006dfe198af53c442bda1ab2dda95cc932cIADmsww8Gl2xDFEsUCevaz8CfTraxGMRPXDYf4+5KhMnueNl7qhlkZn0IgB4fj2x7jgeYQQAAQCOAx1hAgCOAx1hAwCOAx1hBACOAx1h",
      sessionModel: SessionModel(
        sT: "ClassSession",
        createdOn: "2021-03-30T20:48:22.343Z",
        sId: "60638e9681071200042d95af",
        name: "Moving Together (IOS) - Group 1, Session 1",
        acronym: "MTIOS1G1-211201",
        classId: "60638e5a81071200042d95ac",
        seq: 1,
        provider: "AGORA",
        providerId: "MTIOS1G1-211201",
        date0Z: "2021-12-01",
        scheduledStartTime: "2021-12-01T19:00:00.000Z",
        scheduledEndTime: "2021-12-01T20:00:00.000Z",
        lobbyOpenTime: "2021-12-01T18:45:00.000Z",
        lobbyCloseTime: "2021-12-01T20:15:00.000Z",
        tz: "America/Los_Angeles",
        lobbyTimeMins: 15,
        durationMins: 60,
        instructorId: "auth0|6063865c77b322006822b2d0",
        helpMessage: "The instructor has been notified and will help you soon.",
      ),
      userNumber: 477);

  final String jwtRandom = "jwtRandom";
  final String accronymRandom = "MTIOS1G1-211201";
  final String ticketRandom =
      "WkxU_s9YlsUAj_7_Yeyr9l6ws3HhsMGvVWyhWCl3-MbA9evbQ7Yp-i7slUGmwEvp";
  final String forceTimeRandom = "2021-03-30T20:48:22.343Z";
  final ClassesModel classModelRandom = ClassesModel(sId: "TSH-001");
  final String userIdRandom = "477";
  final TshUser userInfo = TshUser(
      userInfo: UserInfoModel(
          477,
          "",
          UserDataModel(
              "2021-03-11T00:11:00.696Z",
              "server1-1@togetherseniorhealth.com",
              false,
              [],
              "Server 1, Stream 1",
              "server1-1",
              "https://s.gravatar.com/avatar/05e52276748c99ea234ec425dc0eda1b?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fse.png",
              "2021-06-15T21:51:04.235Z",
              "auth0|6049601481454200709b4817",
              "server1-1",
              null),
          null,
          null,
          1629704638386));
  setUp(() {
    mockDashboardRemoteDataSource = MockDashboardRemoteDataSource();
    dashboardRepositoryImpl = DashboardRepositoryImpl(
        dashboardRemoteDataSource: mockDashboardRemoteDataSource);
  });

  group("Test agora token", () {
    test("Create an agora token from a JWT", () async {
      // arrange
      when(mockDashboardRemoteDataSource.createAgoraToken(jwt: jwtRandom))
          .thenAnswer((_) async => agoraModel);
      // act
      final result = await dashboardRepositoryImpl.createAgoraTokenRepository(
          jwt: jwtRandom);

      // assert
      verify(mockDashboardRemoteDataSource.createAgoraToken(jwt: jwtRandom));
      expect(result, equals(Right(agoraModel)));
    });

    test("Failed to create an agora token from a JWT", () async {
      // arrange
      when(mockDashboardRemoteDataSource.createAgoraToken(jwt: jwtRandom))
          .thenThrow(ServerFailure("Exception when retrieving agora token"));
      final call = dashboardRepositoryImpl.createAgoraTokenRepository;
      expect(() => call(jwt: jwtRandom), throwsA(TypeMatcher<ServerFailure>()));
    });

    test("Create an agora token from an accronym", () async {
      // arrange
      when(mockDashboardRemoteDataSource.createSecuredAgoraToken(
              accronym: accronymRandom))
          .thenAnswer((_) async => agoraModel);
      // act
      final result = await dashboardRepositoryImpl
          .createSecuredAgoraTokenRepository(accronym: accronymRandom);

      // assert
      verify(mockDashboardRemoteDataSource.createSecuredAgoraToken(
          accronym: accronymRandom));
      expect(result, equals(Right(agoraModel)));
    });

    test("Failed to create an agora token from a accronym", () async {
      // arrange
      when(mockDashboardRemoteDataSource.createSecuredAgoraToken(
              accronym: accronymRandom))
          .thenThrow(ServerFailure("Exception when retrieving agora token"));
      final call = dashboardRepositoryImpl.createSecuredAgoraTokenRepository;
      expect(() => call(accronym: accronymRandom),
          throwsA(TypeMatcher<ServerFailure>()));
    });
  });

  group("JWT from a ticket", () {
    test("Retrieve a jwt from a ticket", () async {
      // arrange
      when(mockDashboardRemoteDataSource.createJwt(ticket: ticketRandom))
          .thenAnswer((_) async => jwtRandom);
      // act
      final result = await dashboardRepositoryImpl.createJwtRepository(
          ticket: ticketRandom);

      // assert
      verify(mockDashboardRemoteDataSource.createJwt(ticket: ticketRandom));
      expect(result, equals(Right(jwtRandom)));
    });

    test("Failed to retrieve a jwt from a ticket", () async {
      // arrange
      when(mockDashboardRemoteDataSource.createJwt(ticket: ticketRandom))
          .thenThrow(
              ServerFailure("Exception when retrieving JWT from ticket"));
      final call = dashboardRepositoryImpl.createJwtRepository;
      expect(() => call(ticket: ticketRandom),
          throwsA(TypeMatcher<ServerFailure>()));
    });
  });
  group("Force Time stored", () {
    test("Retrieve the stored forced time", () async {
      // arrange
      when(mockDashboardRemoteDataSource.getForceTime())
          .thenAnswer((_) => forceTimeRandom);
      // act
      final result = dashboardRepositoryImpl.getForceTime();

      // assert
      verify(mockDashboardRemoteDataSource.getForceTime());
      expect(result, equals(forceTimeRandom));
    });

    test("Failed to retrieve stored forced time", () async {
      // arrange
      when(mockDashboardRemoteDataSource.getForceTime())
          .thenAnswer((realInvocation) => null);
      final call = dashboardRepositoryImpl.getForceTime;
      expect(call(), null);
    });
  });
  group("Get class information", () {
    test("Retrieve the class information related to the given acronym",
        () async {
      // arrange
      when(mockDashboardRemoteDataSource.getClassInfo(
              class1Acronym: accronymRandom))
          .thenAnswer((_) async => classModelRandom);
      // act
      final result = await dashboardRepositoryImpl.getClassInfoRepository(
          class1Acronym: accronymRandom);

      // assert
      verify(mockDashboardRemoteDataSource.getClassInfo(
          class1Acronym: accronymRandom));
      expect(result, equals(Right(classModelRandom)));
    });

    test(
        "Failed to retrieve the class information related to the given acronym",
        () async {
      // arrange
      when(mockDashboardRemoteDataSource.getClassInfo(
              class1Acronym: accronymRandom))
          .thenThrow(ServerFailure("Exception when retrieving class info"));
      final call = dashboardRepositoryImpl.getClassInfoRepository;
      expect(() => call(class1Acronym: accronymRandom),
          throwsA(TypeMatcher<ServerFailure>()));
    });
  });
  group("Get user info", () {
    test("Retrieve the user information related to the given userId", () async {
      // arrange
      when(mockDashboardRemoteDataSource.getUserInfo(user2Id: userIdRandom))
          .thenAnswer((_) async => userInfo);
      // act
      final result = await dashboardRepositoryImpl.getUserInfoRepository(
          user2Id: userIdRandom);

      // assert
      verify(mockDashboardRemoteDataSource.getUserInfo(user2Id: userIdRandom));
      expect(result, equals(Right(userInfo)));
    });

    test("Failed to retrieve the user information related to the given userId",
        () async {
      // arrange
      when(mockDashboardRemoteDataSource.getUserInfo(user2Id: userIdRandom))
          .thenThrow(ServerFailure("Exception when retrieving user info"));
      final call = dashboardRepositoryImpl.getUserInfoRepository;
      expect(() => call(user2Id: userIdRandom),
          throwsA(TypeMatcher<ServerFailure>()));
    });
  });

  test("Retrieve the upcoming class for the user", () async {
    Function eq = const ListEquality().equals;
    final classes = [classModelRandom];
    // arrange
    when(mockDashboardRemoteDataSource.upcomingClasses())
        .thenAnswer((_) async => classes);
    // act
    final result = await dashboardRepositoryImpl.upcomingClassesRepository();

    // assert
    verify(mockDashboardRemoteDataSource.upcomingClasses());

    var classesResponse = [];
    result.fold((l) => null, (r) => classesResponse = r);
    expect(eq(classes, classesResponse), true);
  });

  test("Retrieve the upcoming adhoc class for the user", () async {
    Function eq = const ListEquality().equals;
    final classes = [classModelRandom];
    // arrange
    when(mockDashboardRemoteDataSource.upcomingAdhocClasses())
        .thenAnswer((_) async => classes);
    // act
    final result =
        await dashboardRepositoryImpl.upcomingAdhocClassesRepository();

    // assert
    verify(mockDashboardRemoteDataSource.upcomingAdhocClasses());

    var classesResponse = [];
    result.fold((l) => null, (r) => classesResponse = r);
    expect(eq(classes, classesResponse), true);
  });
}
