class StartTime {
  int hour;
  int mins;
  String tz;

  StartTime({this.hour, this.mins, this.tz});

  StartTime.fromJson(Map<String, dynamic> json) {
    hour = json['hour'];
    mins = json['mins'];
    tz = json['tz'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['hour'] = this.hour;
    data['mins'] = this.mins;
    data['tz'] = this.tz;
    return data;
  }

  @override
  bool operator ==(other) {
    return (other is StartTime) &&
        other.hour == hour &&
        other.mins == mins &&
        other.tz == tz;
  }
}
