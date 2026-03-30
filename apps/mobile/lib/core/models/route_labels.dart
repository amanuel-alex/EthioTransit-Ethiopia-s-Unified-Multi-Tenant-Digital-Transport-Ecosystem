import 'station_ref.dart';

abstract final class RouteLabels {
  static String short({
    required String originCity,
    required String destinationCity,
    StationRef? originStation,
    StationRef? destinationStation,
  }) {
    final o = originStation?.name ?? originCity;
    final d = destinationStation?.name ?? destinationCity;
    return '$o → $d';
  }

  static String line({
    required String originCity,
    required String destinationCity,
    StationRef? originStation,
    StationRef? destinationStation,
  }) {
    String leg(String city, StationRef? st) {
      if (st == null) return city;
      final cn = st.cityName;
      if (cn != null && cn.isNotEmpty) return '${st.name} · $cn';
      return st.name;
    }

    return '${leg(originCity, originStation)} → ${leg(destinationCity, destinationStation)}';
  }
}
