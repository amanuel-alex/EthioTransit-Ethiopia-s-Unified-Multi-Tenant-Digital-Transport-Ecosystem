class StationRef {
  const StationRef({
    required this.id,
    required this.name,
    this.cityName,
  });

  final String id;
  final String name;
  final String? cityName;

  static StationRef? maybeFrom(dynamic raw) {
    if (raw is! Map<String, dynamic>) return null;
    final city = raw['city'] as Map<String, dynamic>?;
    return StationRef(
      id: raw['id'] as String,
      name: raw['name'] as String,
      cityName: city?['name'] as String?,
    );
  }
}
