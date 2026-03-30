class PopularRouteOption {
  const PopularRouteOption({
    required this.origin,
    required this.destination,
    this.bookingCount = 0,
  });

  final String origin;
  final String destination;
  final int bookingCount;

  factory PopularRouteOption.fromJson(Map<String, dynamic> j) {
    return PopularRouteOption(
      origin: j['origin'] as String,
      destination: j['destination'] as String,
      bookingCount: (j['bookingCount'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Used when the API returns no rows or fails.
const List<PopularRouteOption> kPopularRoutesFallback = [
  PopularRouteOption(origin: 'Addis Ababa', destination: 'Hawassa'),
  PopularRouteOption(origin: 'Addis Ababa', destination: 'Bahir Dar'),
  PopularRouteOption(origin: 'Addis Ababa', destination: 'Dire Dawa'),
  PopularRouteOption(origin: 'Hawassa', destination: 'Addis Ababa'),
];
