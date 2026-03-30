import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/models/booking_models.dart';
import '../../data/ethiotransit_repository.dart';
import '../../theme/app_theme.dart';

class TicketScreen extends ConsumerWidget {
  const TicketScreen({super.key, required this.bookingId});

  final String bookingId;

  static Future<BookingRow?> _load(EthiotransitRepository repo, String id) =>
      repo.bookingById(id);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(ethiotransitRepositoryProvider);
    return FutureBuilder<BookingRow?>(
      future: _load(repo, bookingId),
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return Scaffold(
            appBar: AppBar(title: const Text('Your ticket')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        final b = snap.data;
        if (b == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Your ticket')),
            body: const Center(child: Text('Booking not found')),
          );
        }
        if (b.status != 'PAID') {
          return Scaffold(
            appBar: AppBar(title: const Text('Your ticket')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Booking is ${b.status}. Complete payment to unlock the ticket.',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        }

        final df = DateFormat.yMMMd().add_jm();
        final qrPayload =
            'ethiotransit|booking:${b.id}|route:${b.schedule.routeLabel}|seats:${b.seats.join(",")}';
        final shareText =
            'EthioTransit · ${b.schedule.routeLabel}\n${df.format(b.schedule.departsAt.toLocal())}\nSeats: ${b.seats.join(", ")}\nRef: ${b.id}';

        return Scaffold(
          appBar: AppBar(title: const Text('Your ticket')),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                'Ready for departure',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
              ),
              const SizedBox(height: 8),
              Card(
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      color: AppColors.ethGreen.withValues(alpha: 0.15),
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.ethGreen,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'CONFIRMED',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            b.schedule.plate,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: QrImageView(
                              data: qrPayload,
                              version: QrVersions.auto,
                              size: 200,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            b.schedule.routeLabel,
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            df.format(b.schedule.departsAt.toLocal()),
                            style: Theme.of(context).textTheme.bodyMedium,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Seats: ${b.seats.join(", ")}',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => Share.share(shareText, subject: 'EthioTransit ticket'),
                      icon: const Icon(Icons.ios_share_rounded),
                      label: const Text('Share'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
