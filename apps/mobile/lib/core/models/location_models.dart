class CityListItem {
  const CityListItem({
    required this.id,
    required this.name,
    required this.slug,
    required this.stationCount,
  });

  final String id;
  final String name;
  final String slug;
  final int stationCount;

  factory CityListItem.fromJson(Map<String, dynamic> j) {
    final count = j['_count'] as Map<String, dynamic>?;
    return CityListItem(
      id: j['id'] as String,
      name: j['name'] as String,
      slug: j['slug'] as String,
      stationCount: (count?['stations'] as num?)?.toInt() ?? 0,
    );
  }
}

class StationListItem {
  const StationListItem({
    required this.id,
    required this.name,
    this.address,
    required this.cityId,
    required this.cityName,
  });

  final String id;
  final String name;
  final String? address;
  final String cityId;
  final String cityName;

  factory StationListItem.fromJson(Map<String, dynamic> j) {
    final city = j['city'] as Map<String, dynamic>?;
    return StationListItem(
      id: j['id'] as String,
      name: j['name'] as String,
      address: j['address'] as String?,
      cityId: city?['id'] as String? ?? '',
      cityName: city?['name'] as String? ?? '',
    );
  }
}
