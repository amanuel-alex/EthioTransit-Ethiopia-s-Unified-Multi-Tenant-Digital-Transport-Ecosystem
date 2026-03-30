import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../constants/popular_routes.dart';
import '../../core/models/schedule_detail.dart';
import '../../data/api_exception.dart';
import '../../data/ethiotransit_repository.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/trip_card.dart';
import '../search/search_results_screen.dart';
import '../seat/seat_selection_screen.dart';

final _upcomingProvider = FutureProvider.autoDispose<List<TripHit>>((ref) async {
  final repo = ref.watch(ethiotransitRepositoryProvider);
  return repo.upcomingTrips(limit: 6);
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _from = TextEditingController(text: 'Addis Ababa');
  final _to = TextEditingController(text: 'Hawassa');
  DateTime _date = DateTime.now().add(const Duration(days: 1));

  @override
  void dispose() {
    _from.dispose();
    _to.dispose();
    super.dispose();
  }

  void _search() {
    if (_from.text.trim().isEmpty || _to.text.trim().isEmpty) return;
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute<void>(
        builder: (_) => SearchResultsScreen(
          origin: _from.text.trim(),
          destination: _to.text.trim(),
          travelDate: _date,
        ),
      ),
    );
  }

  void _openSeat(TripHit hit) {
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute<void>(
        builder: (_) => SeatSelectionScreen(trip: hit),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authSessionProvider).valueOrNull;
    final upcoming = ref.watch(_upcomingProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(_upcomingProvider),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Welcome back',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: Colors.grey,
                                      ),
                                ),
                                Text(
                                  auth?.user.phone ?? 'Passenger',
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          IconButton.filledTonal(
                            onPressed: () {},
                            icon: const Icon(Icons.notifications_outlined),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Where are you going?',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              color: AppColors.ethGreen,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 16),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                'WHERE TO?',
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: AppColors.ethGreen,
                                      letterSpacing: 1.2,
                                    ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _from,
                                decoration: const InputDecoration(
                                  labelText: 'From',
                                  prefixIcon: Icon(Icons.trip_origin),
                                ),
                              ),
                              const SizedBox(height: 12),
                              TextField(
                                controller: _to,
                                decoration: const InputDecoration(
                                  labelText: 'To',
                                  prefixIcon: Icon(Icons.place_outlined),
                                ),
                              ),
                              const SizedBox(height: 12),
                              ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: const Icon(Icons.calendar_today_rounded),
                                title: const Text('Travel date'),
                                subtitle: Text('${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: _date,
                                    firstDate: DateTime.now(),
                                    lastDate: DateTime.now().add(const Duration(days: 365)),
                                  );
                                  if (picked != null) setState(() => _date = picked);
                                },
                              ),
                              const SizedBox(height: 8),
                              FilledButton.icon(
                                onPressed: _search,
                                icon: const Icon(Icons.search),
                                label: const Text('Find best routes'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      Text(
                        'Popular routes',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: kPopularRoutes.map((r) {
                          return ActionChip(
                            label: Text('${r.origin} → ${r.destination}'),
                            onPressed: () {
                              _from.text = r.origin;
                              _to.text = r.destination;
                              _search();
                            },
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 28),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Available soon',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          TextButton(
                            onPressed: () => ref.invalidate(_upcomingProvider),
                            child: const Text('Refresh'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              upcoming.when(
                data: (list) {
                  if (list.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(child: Text('No upcoming departures — try search.')),
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList.separated(
                      itemCount: list.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (ctx, i) {
                        final hit = list[i];
                        return TripCard(
                          hit: hit,
                          compact: true,
                          onBook: () => _openSeat(hit),
                        );
                      },
                    ),
                  );
                },
                loading: () => const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),
                error: (e, _) => SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      e is ApiException ? e.message : '$e',
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }
}
