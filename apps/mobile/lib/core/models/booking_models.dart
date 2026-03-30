class BookingRow {
  const BookingRow({
    required this.id,
    required this.status,
    required this.totalAmount,
    required this.currency,
    required this.createdAt,
    required this.schedule,
    required this.seats,
  });

  final String id;
  final String status;
  final String totalAmount;
  final String currency;
  final DateTime createdAt;
  final BookingSchedule schedule;
  final List<int> seats;

  factory BookingRow.fromJson(Map<String, dynamic> j) {
    final s = j['schedule'] as Map<String, dynamic>;
    final route = s['route'] as Map<String, dynamic>;
    final bus = s['bus'] as Map<String, dynamic>;
    final seatList = j['seats'] as List<dynamic>? ?? [];
    return BookingRow(
      id: j['id'] as String,
      status: j['status'] as String,
      totalAmount: j['totalAmount'].toString(),
      currency: j['currency'] as String? ?? 'ETB',
      createdAt: DateTime.parse(j['createdAt'] as String),
      schedule: BookingSchedule(
        id: s['id'] as String,
        departsAt: DateTime.parse(s['departsAt'] as String),
        arrivesAt: DateTime.parse(s['arrivesAt'] as String),
        origin: route['origin'] as String,
        destination: route['destination'] as String,
        plate: bus['plateNumber'] as String? ?? '',
      ),
      seats: seatList.map((e) => (e as Map)['seatNo'] as int).toList(),
    );
  }
}

class BookingSchedule {
  const BookingSchedule({
    required this.id,
    required this.departsAt,
    required this.arrivesAt,
    required this.origin,
    required this.destination,
    required this.plate,
  });

  final String id;
  final DateTime departsAt;
  final DateTime arrivesAt;
  final String origin;
  final String destination;
  final String plate;

  String get routeLabel => '$origin → $destination';
}

class CreateBookingResult {
  const CreateBookingResult({
    required this.id,
    required this.status,
    required this.totalAmount,
    required this.currency,
    required this.seats,
  });

  final String id;
  final String status;
  final String totalAmount;
  final String currency;
  final List<int> seats;
}
