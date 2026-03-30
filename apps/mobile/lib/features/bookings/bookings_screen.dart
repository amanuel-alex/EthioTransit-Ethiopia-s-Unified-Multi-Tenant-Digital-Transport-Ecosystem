import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/models/booking_models.dart';
import '../../data/api_exception.dart';
import '../../data/ethiotransit_repository.dart';
import '../checkout/checkout_screen.dart';
import '../ticket/ticket_screen.dart';

final _bookingsProvider = FutureProvider.autoDispose<List<BookingRow>>((ref) async {
  return ref.watch(ethiotransitRepositoryProvider).listUserBookings();
});

class BookingsScreen extends ConsumerWidget {
  const BookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_bookingsProvider);

    return Scaffold(
      body: SafeArea(
        child: async.when(
          data: (rows) {
            final now = DateTime.now();
            final upcoming = rows.where((b) {
              if (b.status == 'CANCELLED') return false;
              if (b.status == 'PENDING') return true;
              return !b.schedule.departsAt.toLocal().isBefore(now.subtract(const Duration(days: 1)));
            }).toList();
            final past = rows.where((b) {
              if (b.status == 'PENDING') return false;
              if (b.status == 'CANCELLED') return true;
              return b.schedule.departsAt.toLocal().isBefore(now);
            }).toList();

            return DefaultTabController(
              length: 2,
              child: Column(
                children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'My bookings',
                        style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const TabBar(
                    tabs: [
                      Tab(text: 'Upcoming'),
                      Tab(text: 'Past / cancelled'),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _BookingList(
                          list: upcoming,
                          empty: 'No upcoming trips',
                        ),
                        _BookingList(
                          list: past,
                          empty: 'No past bookings',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Text(e is ApiException ? e.message : '$e'),
          ),
        ),
      ),
    );
  }
}

class _BookingList extends StatelessWidget {
  const _BookingList({
    required this.list,
    required this.empty,
  });

  final List<BookingRow> list;
  final String empty;

  @override
  Widget build(BuildContext context) {
    if (list.isEmpty) {
      return Center(child: Text(empty));
    }
    final df = DateFormat.yMMMd().add_jm();
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (ctx, i) {
        final b = list[i];
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        b.schedule.routeLabel,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                    Chip(
                      label: Text(b.status, style: const TextStyle(fontSize: 11)),
                    ),
                  ],
                ),
                Text(df.format(b.schedule.departsAt.toLocal())),
                Text('Seats: ${b.seats.join(", ")} · ${b.totalAmount} ${b.currency}'),
                const SizedBox(height: 8),
                if (b.status == 'PENDING')
                  FilledButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => CheckoutScreen(
                            bookingId: b.id,
                            totalAmount: b.totalAmount,
                            currency: b.currency,
                            routeLabel: b.schedule.routeLabel,
                            departsAt: b.schedule.departsAt,
                            seatNumbers: b.seats,
                          ),
                        ),
                      );
                    },
                    child: const Text('Pay now'),
                  ),
                if (b.status == 'PAID')
                  OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => TicketScreen(bookingId: b.id),
                        ),
                      );
                    },
                    child: const Text('View ticket'),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
