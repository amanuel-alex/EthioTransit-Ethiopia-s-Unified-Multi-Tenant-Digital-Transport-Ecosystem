import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/models/booking_models.dart';
import '../data/ethiotransit_repository.dart';

final passengerBookingsProvider =
    FutureProvider.autoDispose<List<BookingRow>>((ref) async {
  return ref.watch(ethiotransitRepositoryProvider).listUserBookings();
});
