import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/schedule_detail.dart';
import '../../data/api_exception.dart';
import '../../data/ethiotransit_repository.dart';
import '../../theme/app_theme.dart';
import '../../widgets/ethio_background.dart';
import '../../widgets/trip_card.dart';
import '../seat/seat_selection_screen.dart';

class SearchResultsScreen extends ConsumerStatefulWidget {
  const SearchResultsScreen({
    super.key,
    required this.origin,
    required this.destination,
    required this.travelDate,
  });

  final String origin;
  final String destination;
  final DateTime travelDate;

  @override
  ConsumerState<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends ConsumerState<SearchResultsScreen> {
  late Future<List<TripHit>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _future = ref.read(ethiotransitRepositoryProvider).searchTrips(
          origin: widget.origin,
          destination: widget.destination,
          travelDate: widget.travelDate,
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: Text(
          '${widget.origin} → ${widget.destination}',
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: EthioBackground(
        child: FutureBuilder<List<TripHit>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: 5,
                itemBuilder: (_, i) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Card(
                    child: SizedBox(
                      height: 108,
                      child: Center(
                        child: i == 0
                            ? const CircularProgressIndicator(color: AppColors.ethGreen)
                            : Icon(Icons.directions_bus_outlined, color: Colors.grey.shade700),
                      ),
                    ),
                  ),
                ),
              );
            }
            if (snap.hasError) {
              final e = snap.error;
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(e is ApiException ? e.message : '$e'),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () => setState(_load),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              );
            }
            final hits = snap.data ?? [];
            if (hits.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.directions_bus_outlined, size: 56),
                    const SizedBox(height: 32),
                    const Text('No buses found for this route and date'),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Go back'),
                    ),
                  ],
                ),
              );
            }
            return RefreshIndicator(
              color: AppColors.ethGreen,
              onRefresh: () async => setState(_load),
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                itemCount: hits.length,
                separatorBuilder: (context, index) => const SizedBox(height: 14),
                itemBuilder: (ctx, i) {
                  final hit = hits[i];
                  return TripCard(
                    hit: hit,
                    onBook: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => SeatSelectionScreen(trip: hit),
                        ),
                      );
                    },
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
