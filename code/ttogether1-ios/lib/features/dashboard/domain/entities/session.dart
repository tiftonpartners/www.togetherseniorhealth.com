class GenericSession {
  final String sT;
  final String createdOn;
  final String sId;
  final String name;
  final String acronym;
  final String classId;
  final int seq;
  final String provider;
  final String providerId;
  final String date0Z;
  final String scheduledStartTime;
  final String scheduledEndTime;
  final String lobbyOpenTime;
  final String lobbyCloseTime;
  final String tz;
  final int lobbyTimeMins;
  final int durationMins;
  final String instructorId;
  final String helpMessage;

  GenericSession(
      {this.sT,
      this.createdOn,
      this.sId,
      this.name,
      this.acronym,
      this.classId,
      this.seq,
      this.provider,
      this.providerId,
      this.date0Z,
      this.scheduledStartTime,
      this.scheduledEndTime,
      this.lobbyOpenTime,
      this.lobbyCloseTime,
      this.tz,
      this.lobbyTimeMins,
      this.durationMins,
      this.instructorId,
      this.helpMessage});

  factory GenericSession.fromJson(Map<String, dynamic> json) {
    return GenericSession(
      sT: json['__t'],
    );
  }

  Map<String, dynamic> toJson() => {
        '__t': sT,
      };
}
