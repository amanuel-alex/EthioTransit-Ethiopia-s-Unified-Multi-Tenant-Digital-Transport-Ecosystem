class RouteSearchRow {
  const RouteSearchRow({
    required this.id,
    required this.origin,
    required this.destination,
    required this.companyName,
  });

  final String id;
  final String origin;
  final String destination;
  final String companyName;

  factory RouteSearchRow.fromJson(Map<String, dynamic> j) {
    final company = j['company'] as Map<String, dynamic>?;
    return RouteSearchRow(
      id: j['id'] as String,
      origin: j['origin'] as String,
      destination: j['destination'] as String,
      companyName: company?['name'] as String? ?? 'Operator',
    );
  }
}
