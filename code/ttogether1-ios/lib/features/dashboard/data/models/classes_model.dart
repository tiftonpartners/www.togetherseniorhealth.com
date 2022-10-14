import 'package:dartz/dartz.dart';
import 'package:tsh/features/dashboard/data/models/session_model.dart';
import 'package:tsh/features/dashboard/domain/entities/instructor.dart';
import 'package:tsh/features/dashboard/domain/entities/instructor_data.dart';
import 'package:tsh/features/dashboard/domain/entities/schedule.dart';
import 'package:collection/collection.dart';

//TODO: need to be sperate between model and entities
class ClassesModel {
  List<String> participants;
  String sId;
  String name;
  String description;
  String acronym;
  String helpMessage;
  String checkPageHelpMessage;
  String instructorId;
  String createdOn;
  List<SessionModel> sessions;
  String courseId;
  String program;
  int iV;
  int capacity;
  int durationMins;
  InstructorData instructorData;
  int lobbyTimeMins;
  int numSessions;
  Schedule schedule;
  String startDate0Z;
  Instructor instructor;
  bool isAdhoc = false;

  ClassesModel(
      {this.participants,
      this.sId,
      this.name,
      this.description,
      this.acronym,
      this.helpMessage,
      this.checkPageHelpMessage,
      this.instructorId,
      this.createdOn,
      this.sessions,
      this.courseId,
      this.program,
      this.iV,
      this.capacity,
      this.durationMins,
      this.instructorData,
      this.lobbyTimeMins,
      this.numSessions,
      this.schedule,
      this.startDate0Z,
      this.instructor});

  ClassesModel.fromJson(Map<String, dynamic> json) {
    participants = json['participants'].cast<String>();
    sId = json['_id'];
    name = json['name'];
    description = json['description'];
    acronym = json['acronym'];
    helpMessage = json['helpMessage'];
    checkPageHelpMessage = json['checkPageHelpMessage'];
    instructorId = json['instructorId'];
    createdOn = json['createdOn'];
    if (json['sessions'] != null) {
      sessions = new List<SessionModel>();
      json['sessions'].forEach((v) {
        sessions.add(new SessionModel.fromJson(v));
      });
    }
    courseId = json['courseId'];
    program = json['program'];
    iV = json['__v'];
    capacity = json['capacity'];
    durationMins = json['durationMins'];
    instructorData = json['instructorData'] != null
        ? new InstructorData.fromJson(json['instructorData'])
        : null;
    lobbyTimeMins = json['lobbyTimeMins'];
    numSessions = json['numSessions'];
    schedule = json['schedule'] != null
        ? new Schedule.fromJson(json['schedule'])
        : null;
    startDate0Z = json['startDate0Z'];
    instructor = json['instructor'] != null
        ? new Instructor.fromJson(json['instructor'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['participants'] = this.participants;
    data['_id'] = this.sId;
    data['name'] = this.name;
    data['description'] = this.description;
    data['acronym'] = this.acronym;
    data['helpMessage'] = this.helpMessage;
    data['checkPageHelpMessage'] = this.checkPageHelpMessage;
    data['instructorId'] = this.instructorId;
    data['createdOn'] = this.createdOn;
    if (this.sessions != null) {
      data['sessions'] = this.sessions.map((v) => v.toJson()).toList();
    }
    data['courseId'] = this.courseId;
    data['program'] = this.program;
    data['__v'] = this.iV;
    data['capacity'] = this.capacity;
    data['durationMins'] = this.durationMins;
    if (this.instructorData != null) {
      data['instructorData'] = this.instructorData.toJson();
    }
    data['lobbyTimeMins'] = this.lobbyTimeMins;
    data['numSessions'] = this.numSessions;
    if (this.schedule != null) {
      data['schedule'] = this.schedule.toJson();
    }
    data['startDate0Z'] = this.startDate0Z;
    if (this.instructor != null) {
      data['instructor'] = this.instructor.toJson();
    }
    return data;
  }

  @override
  bool operator ==(other) {
    Function eq = const ListEquality().equals;
    return (other is ClassesModel) &&
        eq(other.participants, participants) &&
        other.sId == sId &&
        other.name == name &&
        other.description == description &&
        other.acronym == acronym &&
        other.helpMessage == helpMessage &&
        other.checkPageHelpMessage == checkPageHelpMessage &&
        other.instructorId == instructorId &&
        other.createdOn == createdOn &&
        eq(other.sessions, sessions) &&
        other.courseId == courseId &&
        other.program == program &&
        other.iV == iV &&
        other.capacity == capacity &&
        other.durationMins == durationMins &&
        other.instructorData == instructorData &&
        other.lobbyTimeMins == lobbyTimeMins &&
        other.numSessions == numSessions &&
        other.startDate0Z == startDate0Z &&
        other.instructor == instructor &&
        other.schedule == schedule;
  }
}
