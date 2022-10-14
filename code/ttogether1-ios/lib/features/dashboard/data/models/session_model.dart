import 'package:tsh/features/dashboard/domain/entities/session.dart';

class SessionModel extends GenericSession {
  SessionModel({
    String sT,
    String createdOn,
    String sId,
    String name,
    String acronym,
    String classId,
    int seq,
    String provider,
    String providerId,
    String date0Z,
    String scheduledStartTime,
    String scheduledEndTime,
    String lobbyOpenTime,
    String lobbyCloseTime,
    String tz,
    int lobbyTimeMins,
    int durationMins,
    String instructorId,
    String helpMessage,
  }) : super(
          acronym: acronym,
          classId: classId,
          createdOn: createdOn,
          date0Z: date0Z,
          durationMins: durationMins,
          helpMessage: helpMessage,
          sId: sId,
          instructorId: instructorId,
          lobbyCloseTime: lobbyCloseTime,
          lobbyOpenTime: lobbyOpenTime,
          lobbyTimeMins: lobbyTimeMins,
          name: name,
          provider: provider,
          providerId: providerId,
          sT: sT,
          scheduledEndTime: scheduledEndTime,
          scheduledStartTime: scheduledStartTime,
          seq: seq,
          tz: tz,
        );

  factory SessionModel.fromJson(Map<String, dynamic> json) {
    return SessionModel(
      sT: json['__t'],
      createdOn: json['createdOn'],
      sId: json['_id'],
      name: json['name'],
      acronym: json['acronym'],
      classId: json['classId'],
      seq: json['seq'],
      provider: json['provider'],
      providerId: json['providerId'],
      date0Z: json['date0Z'],
      scheduledStartTime: json['scheduledStartTime'],
      scheduledEndTime: json['scheduledEndTime'],
      lobbyOpenTime: json['lobbyOpenTime'],
      lobbyCloseTime: json['lobbyCloseTime'],
      tz: json['tz'],
      lobbyTimeMins: json['lobbyTimeMins'],
      durationMins: json['durationMins'],
      instructorId: json['instructorId'],
      helpMessage: json['helpMessage'],
    );
  }

  Map<String, dynamic> toJson() => {
        '__t': sT,
        'createdOn': createdOn,
        '_id': sId,
        'name': name,
        'acronym': acronym,
        'classId': classId,
        'seq': seq,
        'provider': provider,
        'providerId': providerId,
        'date0Z': date0Z,
        'scheduledStartTime': scheduledStartTime,
        'scheduledEndTime': scheduledEndTime,
        'lobbyOpenTime': lobbyOpenTime,
        'lobbyCloseTime': lobbyCloseTime,
        'tz': tz,
        'lobbyTimeMins': lobbyTimeMins,
        'durationMins': durationMins,
        'instructorId': instructorId,
        'helpMessage': helpMessage,
      };

  @override
  bool operator ==(other) {
    return (other is SessionModel) &&
        other.sT == sT &&
        other.createdOn == createdOn &&
        other.sId == sId &&
        other.name == name &&
        other.acronym == acronym &&
        other.classId == classId &&
        other.seq == seq &&
        other.provider == provider &&
        other.providerId == providerId &&
        other.date0Z == date0Z &&
        other.scheduledStartTime == scheduledStartTime &&
        other.scheduledEndTime == scheduledEndTime &&
        other.lobbyOpenTime == lobbyOpenTime &&
        other.lobbyCloseTime == lobbyCloseTime &&
        other.tz == tz &&
        other.lobbyTimeMins == lobbyTimeMins &&
        other.durationMins == durationMins &&
        other.instructorId == instructorId &&
        other.helpMessage == helpMessage;
  }
}
