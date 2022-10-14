import 'package:collection/collection.dart';

import 'start_time.dart';

class Schedule {
  StartTime startTime;
  List<String> weekdays;
  String sId;

  Schedule({this.startTime, this.weekdays, this.sId});

  Schedule.fromJson(Map<String, dynamic> json) {
    startTime = json['startTime'] != null
        ? new StartTime.fromJson(json['startTime'])
        : null;
    weekdays = json['weekdays'].cast<String>();
    sId = json['_id'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.startTime != null) {
      data['startTime'] = this.startTime.toJson();
    }
    data['weekdays'] = this.weekdays;
    data['_id'] = this.sId;
    return data;
  }

  @override
  bool operator ==(other) {
    Function eq = const ListEquality().equals;
    return (other is Schedule) &&
        eq(other.weekdays, weekdays) &&
        other.sId == sId &&
        other.startTime == startTime;
  }
}
