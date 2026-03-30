import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/models/booking_models.dart';
import '../../data/api_exception.dart';
import '../../data/ethiotransit_repository.dart';
import '../../theme/app_theme.dart';
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
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: async.when(
          data: (paid) {
            final header = Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Tickets',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
            );
            if (paid.isEmpty) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  header,
                  Expanded(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Text(
                          'No tickets yet — complete a booking to see it here.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            height: 1.4,
                            fontSize: 15,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }
            final df = DateFormat.yMMMd().add_jm();
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              children: [
                header,
                ...List.generate(paid.length, (i) {
                  final b = paid[i];
                  return Padding(
                    padding: EdgeInsets.only(bottom: i == paid.length - 1 ? 0 : 12),
                    child: Card(
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                        title: Text(
                          b.schedule.routeLabel,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(df.format(b.schedule.departsAt.toLocal())),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.ethGreen.withValues(alpha: 0.18),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.qr_code_2_rounded, color: AppColors.ethGreenNeon),
                        ),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => TicketScreen(bookingId: b.id),
                            ),
                          );
                        },
                      ),
                    ),
                  );
                }),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.ethGreen)),
          error: (e, _) => Center(
            child: Text(e is ApiException ? e.message : '$e'),
          ),
        ),
      ),
    );
  }
}
