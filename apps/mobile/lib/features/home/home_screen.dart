import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

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
    final auth = ref.watch(authSessionProvider).asData?.value;
    final upcoming = ref.watch(_upcomingProvider);
    final dark = Theme.of(context).brightness == Brightness.dark;
    final dateFmt = DateFormat.yMMMd();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.ethGreen,
          onRefresh: () async => ref.invalidate(_upcomingProvider),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 26,
                            backgroundColor: AppColors.ethGreen.withValues(alpha: 0.2),
                            child: const Icon(Icons.person_rounded, color: AppColors.ethGreenNeon),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Welcome back',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: dark ? const Color(0xFF9CA3AF) : const Color(0xFF64748B),
                                        fontWeight: FontWeight.w500,
                                      ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  auth?.user.phone ?? 'Passenger',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w800,
                                      ),

                                ),
                              ],
                            ),
                          ),
                          Material(
                            color: AppColors.ethGreen.withValues(alpha: 0.14),
                            shape: const CircleBorder(),
                            child: InkWell(
                              customBorder: const CircleBorder(),
                              onPressed: () {},
                              child: const Padding(
                                padding: EdgeInsets.all(12),
                                child: Icon(Icons.notifications_outlined, color: AppColors.ethGreenNeon),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 22),
                      Text(
                        'EthioTransit',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              color: AppColors.ethGreenNeon,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.8,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Where are you going?',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Seamless travel across Ethiopia — find routes, seats, and tickets in one place.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: dark ? const Color(0xFF9CA3AF) : const Color(0xFF64748B),
                              height: 1.35,
                            ),
                      ),
                      const SizedBox(height: 22),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: LinearGradient(
                            colors: [
                              AppColors.ethGreen.withValues(alpha: dark ? 0.12 : 0.08),
                              Colors.transparent,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          border: Border.all(
                            color: AppColors.ethGreen.withValues(alpha: dark ? 0.35 : 0.28),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: dark ? 0.35 : 0.06),
                              blurRadius: 28,
                              offset: const Offset(0, 14),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(1.2),
                          child: Card(
                            margin: EdgeInsets.zero,
                            color: dark ? AppColors.cardDark : Colors.white,
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text(
                                    'WHERE TO?',
                                    style: Theme.of(context).textTheme.labelSmall,
                                  ),
                                  const SizedBox(height: 14),
                                  TextField(
                                    controller: _from,
                                    decoration: InputDecoration(
                                      labelText: 'From',
                                      prefixIcon: Icon(
                                        Icons.trip_origin_rounded,
                                        color: AppColors.ethGreen.withValues(alpha: 0.9),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  TextField(
                                    controller: _to,
                                    decoration: InputDecoration(
                                      labelText: 'To',
                                      prefixIcon: Icon(
                                        Icons.place_rounded,
                                        color: AppColors.ethYellow.withValues(alpha: 0.95),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Material(
                                    color: dark ? const Color(0xFF0D0D0D) : Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(18),
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(18),
                                      onTap: () async {
                                        final picked = await showDatePicker(
                                          context: context,
                                          initialDate: _date,
                                          firstDate: DateTime.now(),
                                          lastDate: DateTime.now().add(const Duration(days: 365)),
                                        );
                                        if (picked != null) setState(() => _date = picked);
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                        child: Row(
                                          children: [
                                            Icon(Icons.calendar_month_rounded, color: AppColors.ethGreenNeon),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    'Travel date',
                                                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                                          color: dark ? const Color(0xFF9CA3AF) : const Color(0xFF64748B),
                                                        ),
                                                  ),
                                                  Text(
                                                    dateFmt.format(_date),
                                                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                                          fontWeight: FontWeight.w700,
                                                        ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Icon(Icons.chevron_right_rounded, color: Colors.grey.shade600),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 18),
                                  FilledButton.icon(
                                    onPressed: _search,
                                    icon: const Icon(Icons.search_rounded, size: 22),
                                    label: const Text('Find best routes'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      Text(
                        'Popular routes',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: kPopularRoutes.map((r) {
                          return ActionChip(
                            avatar: Icon(Icons.route_rounded, size: 18, color: AppColors.ethGreenNeon),
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
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          TextButton.icon(
                            onPressed: () => ref.invalidate(_upcomingProvider),
                            icon: const Icon(Icons.refresh_rounded, size: 18),
                            label: const Text('Refresh'),
                            style: TextButton.styleFrom(foregroundColor: AppColors.ethGreenNeon),
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
                    return SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Center(
                          child: Text(
                            'No upcoming departures — try search.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey.shade500),
                          ),
                        ),
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList.separated(
                      itemCount: list.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 14),
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
                    padding: EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator(color: AppColors.ethGreen)),
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
