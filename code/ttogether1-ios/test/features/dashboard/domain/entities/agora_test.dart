import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/domain/entities/agora.dart';

import 'package:flutter_test/flutter_test.dart';

main() {
  final Agora agoraModel = Agora(
      session: SessionModel(
          acronym: "MTIOS1G1-211201",
          classId: "60638e5a81071200042d95ac",
          createdOn: "2021-03-30T20:48:22.343Z",
          date0Z: "2021-12-01",
          durationMins: 60,
          helpMessage:
              "The instructor has been notified and will help you soon.",
          instructorId: "auth0|6063865c77b322006822b2d0",
          lobbyCloseTime: "2021-12-01T20:15:00.000Z",
          lobbyOpenTime: "2021-12-01T18:45:00.000Z",
          lobbyTimeMins: 15,
          name: "Moving Together (IOS) - Group 1, Session 1",
          provider: "AGORA",
          providerId: "MTIOS1G1-211201",
          sId: "60638e9681071200042d95af",
          sT: "ClassSession",
          scheduledEndTime: "2021-12-01T20:00:00.000Z",
          scheduledStartTime: "2021-12-01T19:00:00.000Z",
          seq: 1,
          tz: "America/Los_Angeles"),
      token:
          "006dfe198af53c442bda1ab2dda95cc932cIAD2NkhTU+codKek+dT0PuNWNFBX043TFIiHGDdXqtws7ONl7qhlkZn0IgAs5IwZRKMkYQQAAQDkbSNhAgDkbSNhAwDkbSNhBADkbSNh",
      userNumber: 477);

  test(
    'should be a subclass of SessionModel entity',
    () async {
      // assert
      expect(agoraModel, isA<Agora>());
    },
  );
}
