import 'package:tsh/features/dashboard/domain/entities/app_meta_data.dart';

class AppMetadataModel extends AppMetadata {
  AppMetadataModel(
    String programs,
  ) : super(
          programs: programs,
        );
  AppMetadataModel.fromJson(Map<String, dynamic> json) {
    this.programs = json['programs'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['programs'] = this.programs;
    return data;
  }

  @override
  bool operator ==(other) {
    return (other is AppMetadata) && other.programs == programs;
  }
}
