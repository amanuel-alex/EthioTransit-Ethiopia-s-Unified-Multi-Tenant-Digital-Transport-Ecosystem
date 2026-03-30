import 'route_labels.dart';
import 'station_ref.dart';

class BusInfo {
  const BusInfo({
    required this.id,
    required this.plateNumber,
    required this.seatCapacity,
  });

  final String id;
  final String plateNumber;
  final int seatCapacity;

  factory BusInfo.fromJson(Map<String, dynamic> j) {
    return BusInfo(
      id: j['id'] as String,
      plateNumber: j['plateNumber'] as String,
      seatCapacity: (j['seatCapacity'] as num).toInt(),
    );
  }
}

class RouteInfo {
  const RouteInfo({
    required this.id,
    required this.origin,
    required this.destination,
    this.originStation,
    this.destinationStation,
  });

  final String id;
  final String origin;
  final String destination;
  final StationRef? originStation;
  final StationRef? destinationStation;

  String get routeShort => RouteLabels.short(
        originCity: origin,
        destinationCity: destination,
        originStation: originStation,
        destinationStation: destinationStation,
      );

  String get routeLine => RouteLabels.line(
        originCity: origin,
        destinationCity: destination,
        originStation: originStation,
        destinationStation: destinationStation,
      );

  factory RouteInfo.fromJson(Map<String, dynamic> j) {
    return RouteInfo(
      id: j['id'] as String,
      origin: j['origin'] as String,
      destination: j['destination'] as String,
      originStation: StationRef.maybeFrom(j['originStation']),
      destinationStation: StationRef.maybeFrom(j['destinationStation']),
    );
  }
}

class ScheduleStub {
  const ScheduleStub({
    required this.id,
    required this.departsAt,
    required this.arrivesAt,
    required this.basePrice,
    required this.route,
    required this.bus,
  });

  final String id;
  final DateTime departsAt;
  final DateTime arrivesAt;
  final String basePrice;
  final RouteInfo route;
  final BusInfo bus;

  factory ScheduleStub.fromJson(Map<String, dynamic> j) {
    return ScheduleStub(
      id: j['id'] as String,
      departsAt: DateTime.parse(j['departsAt'] as String),
      arrivesAt: DateTime.parse(j['arrivesAt'] as String),
      basePrice: j['basePrice'].toString(),
      route: RouteInfo.fromJson(j['route'] as Map<String, dynamic>),
      bus: BusInfo.fromJson(j['bus'] as Map<String, dynamic>),
    );
  }
}

class ScheduleDetail {
  const ScheduleDetail({
    required this.schedule,
    required this.availableSeats,
    required this.occupiedSeats,
  });

  final ScheduleStub schedule;
  final List<int> availableSeats;
  final List<int> occupiedSeats;

  factory ScheduleDetail.fromJson(Map<String, dynamic> j) {
    return ScheduleDetail(
      schedule:
          ScheduleStub.fromJson(j['schedule'] as Map<String, dynamic>),
      availableSeats: (j['availableSeats'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
      occupiedSeats: (j['occupiedSeats'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
    );
  }
}

class TripHit {
  const TripHit({required this.detail, required this.companyName});

  final ScheduleDetail detail;
  final String companyName;

  factory TripHit.fromJson(Map<String, dynamic> j) {
    return TripHit(
      detail: ScheduleDetail.fromJson(j['detail'] as Map<String, dynamic>),
      companyName: j['companyName'] as String? ?? 'Operator',
    );
  }
}
