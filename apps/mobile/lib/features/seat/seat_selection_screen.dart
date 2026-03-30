import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/models/schedule_detail.dart';
import '../../data/api_exception.dart';
import '../../data/ethiotransit_repository.dart';
import '../../theme/app_theme.dart';
import '../checkout/checkout_screen.dart';

class SeatSelectionScreen extends ConsumerStatefulWidget {
  const SeatSelectionScreen({super.key, required this.trip});

  final TripHit trip;

  @override
  ConsumerState<SeatSelectionScreen> createState() => _SeatSelectionScreenState();
}

class _SeatSelectionScreenState extends ConsumerState<SeatSelectionScreen> {
  ScheduleDetail? _detail;
  Object? _error;
  final Set<int> _selected = {};
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final d = await ref.read(ethiotransitRepositoryProvider).scheduleAvailability(
            widget.trip.detail.schedule.id,
          );
      if (mounted) setState(() => _detail = d);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _toggle(int seat) {
    final avail = _detail?.availableSeats ?? [];
    if (!avail.contains(seat)) return;
    setState(() {
      if (_selected.contains(seat)) {
        _selected.remove(seat);
      } else {
        _selected.add(seat);
      }
    });
  }

  double get _unitPrice => double.tryParse(widget.trip.detail.schedule.basePrice) ?? 0;

  double get _total => _unitPrice * _selected.length;

  Future<void> _continue() async {
    if (_selected.isEmpty) return;
    setState(() => _submitting = true);
    try {
      final repo = ref.read(ethiotransitRepositoryProvider);
      final res = await repo.createBooking(
        scheduleId: widget.trip.detail.schedule.id,
        seats: _selected.toList()..sort(),
      );
      if (!mounted) return;
      await Navigator.of(context).push<void>(
        MaterialPageRoute(
          builder: (_) => CheckoutScreen(
            bookingId: res.id,
            totalAmount: res.totalAmount,
            currency: res.currency,
            routeLabel:
                '${widget.trip.detail.schedule.route.origin} → ${widget.trip.detail.schedule.route.destination}',
            departsAt: widget.trip.detail.schedule.departsAt,
            seatNumbers: res.seats,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e is ApiException ? e.message : '$e')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.trip.detail.schedule;
    final timeFmt = DateFormat.jm();

    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Seats')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(_error is ApiException ? (_error! as ApiException).message : '$_error'),
                FilledButton(onPressed: _fetch, child: const Text('Retry')),
              ],
            ),
          ),
        ),
      );
    }

    final cap = _detail!.schedule.bus.seatCapacity;
    final avail = _detail!.availableSeats.toSet();
    final selectedLabel = _selected.isEmpty
        ? '—'
        : (_selected.toList()..sort()).join(', ');

    return Scaffold(
      appBar: AppBar(
        title: Text('Select seats · ${widget.trip.companyName}'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${s.route.origin} → ${s.route.destination}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  '${timeFmt.format(s.departsAt)} · ${s.bus.plateNumber} · ${_detail!.availableSeats.length} seats free',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Container(
            width: double.infinity,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.cardDark,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderDark),
            ),
            child: const Text(
              'FRONT',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, letterSpacing: 2),
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1,
              ),
              itemCount: cap,
              itemBuilder: (ctx, index) {
                final seatNo = index + 1;
                final isAvail = avail.contains(seatNo);
                final isSel = _selected.contains(seatNo);
                Color bg;
                Color fg = Colors.white;
                if (!isAvail) {
                  bg = Colors.grey.shade800;
                  fg = Colors.grey.shade500;
                } else if (isSel) {
                  bg = AppColors.ethGreen;
                  fg = Colors.black;
                } else {
                  bg = AppColors.borderDark;
                }
                return Material(
                  color: bg,
                  borderRadius: BorderRadius.circular(12),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: isAvail ? () => _toggle(seatNo) : null,
                    child: Center(
                      child: Text(
                        '$seatNo',
                        style: TextStyle(fontWeight: FontWeight.bold, color: fg),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text('Selected: $selectedLabel'),
                    ),
                    Text(
                      '${_total.toStringAsFixed(0)} ETB',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.ethGreen,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _selected.isNotEmpty && !_submitting ? _continue : null,
                    child: _submitting
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Continue'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
