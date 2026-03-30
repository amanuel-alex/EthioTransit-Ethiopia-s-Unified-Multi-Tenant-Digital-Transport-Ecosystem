import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/models/booking_models.dart';
import '../../data/api_exception.dart';
import '../../data/ethiotransit_repository.dart';
import '../ticket/ticket_screen.dart';

final _paidTicketsProvider = FutureProvider.autoDispose<List<BookingRow>>((ref) async {
  final rows = await ref.watch(ethiotransitRepositoryProvider).listUserBookings();
  return rows.where((b) => b.status == 'PAID').toList();
});

class TicketsScreen extends ConsumerWidget {
  const TicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_paidTicketsProvider);

    return Scaffold(
      body: SafeArea(
        child: async.when(
          data: (paid) {
            if (paid.isEmpty) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'No tickets yet — complete a booking to see it here.',
                    textAlign: TextAlign.center,
                  ),
                ),
              );
            }
            final df = DateFormat.yMMMd().add_jm();
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: paid.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) {
                final b = paid[i];
                return Card(
                  child: ListTile(
                    title: Text(b.schedule.routeLabel),
                    subtitle: Text(df.format(b.schedule.departsAt.toLocal())),
                    trailing: const Icon(Icons.qr_code_2_rounded),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => TicketScreen(bookingId: b.id),
                        ),
                      );
                    },
                  ),
                );
              },
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
