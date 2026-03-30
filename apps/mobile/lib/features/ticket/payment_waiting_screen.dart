import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/booking_models.dart';
import '../../data/ethiotransit_repository.dart';

/// Polls booking list until status is PAID or timeout (real M-Pesa / Chapa flows).
class PaymentWaitingScreen extends ConsumerStatefulWidget {
  const PaymentWaitingScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  ConsumerState<PaymentWaitingScreen> createState() => _PaymentWaitingScreenState();
}

class _PaymentWaitingScreenState extends ConsumerState<PaymentWaitingScreen> {
  Timer? _timer;
  int _ticks = 0;
  static const _maxTicks = 30;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 2), (_) => _poll());
    _poll();
  }

  Future<void> _poll() async {
    if (!mounted) return;
    setState(() => _ticks++);
    if (_ticks > _maxTicks) {
      _timer?.cancel();
      if (mounted) Navigator.pop(context, false);
      return;
    }
    try {
      final rows = await ref.read(ethiotransitRepositoryProvider).listUserBookings();
      BookingRow? b;
      for (final r in rows) {
        if (r.id == widget.bookingId) b = r;
      }
      if (b != null && b.status == 'PAID') {
        _timer?.cancel();
        if (mounted) Navigator.pop(context, true);
      }
    } catch (_) {
      /* keep polling */
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 24),
              Text(
                'Waiting for payment confirmation',
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Complete payment on your phone. This screen updates when the booking is marked paid.',
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
