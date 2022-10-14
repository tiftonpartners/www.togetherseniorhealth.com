import 'package:flutter_test/flutter_test.dart';
import 'package:tsh/features/dashboard/data/models/agora_model.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/domain/entities/parameters/call_parameters.dart';

void main() {
  var agoraModel;

  final CallParameters callParameters = CallParameters(agora: agoraModel);

  test(
    'should be a subclass of CallParameters entity',
    () async {
      // assert
      expect(callParameters, isA<CallParameters>());
    },
  );

  group("Test sending parameters", () {
    test("Should have the required properties set properly ", () {
      final tempCallParameters = CallParameters(
          agora: AgoraModel(
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
                helpMessage:
                    "The instructor has been notified and will help you soon.",
              ),
              userNumber: 477));

      expect(tempCallParameters.isCheck, true);
      expect(tempCallParameters.isInstructor, null);
      expect(tempCallParameters.instructorInfo, null);
      expect(tempCallParameters.myUserInfo, null);
      expect(tempCallParameters.participantsList, null);
      expect(tempCallParameters.agora.token,
          "006dfe198af53c442bda1ab2dda95cc932cIADmsww8Gl2xDFEsUCevaz8CfTraxGMRPXDYf4+5KhMnueNl7qhlkZn0IgB4fj2x7jgeYQQAAQCOAx1hAgCOAx1hAwCOAx1hBACOAx1h");
      expect(tempCallParameters.agora.userNumber, 477);
    });
  });
}
