import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/models/schedule_detail.dart';
import '../theme/app_theme.dart';

class TripCard extends StatelessWidget {
  const TripCard({
    super.key,
    required this.hit,
    required this.onBook,
    this.compact = false,
  });

  final TripHit hit;
  final VoidCallback onBook;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final s = hit.detail.schedule;
    final left = hit.detail.availableSeats.length;
    final timeFmt = DateFormat.jm();
    final price = s.basePrice;
    final dark = Theme.of(context).brightness == Brightness.dark;

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: dark ? 0.35 : 0.07),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Card(
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onBook,
          child: Padding(
            padding: EdgeInsets.all(compact ? 14 : 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            AppColors.ethGreen.withValues(alpha: 0.35),
                            AppColors.ethGreenDark.withValues(alpha: 0.5),
                          ],
                        ),
                      ),
                      child: const Icon(Icons.directions_bus_rounded, color: Colors.white, size: 26),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            hit.companyName,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                  color: AppColors.ethGreenNeon,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.verified_rounded, size: 16, color: AppColors.ethYellow),
                              const SizedBox(width: 4),
                              Text(
                                'Verified operator',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Colors.grey.shade500,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'ETB $price',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: AppColors.ethGreenNeon,
                              ),
                        ),
                        if (left <= 8 && left > 0)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              '$left SEATS LEFT',
                              style: TextStyle(
                                color: left <= 4 ? AppColors.ethRed : AppColors.ethYellow,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  s.route.routeShort,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: dark ? const Color(0xFF0D0D0D) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              timeFmt.format(s.departsAt.toLocal()),
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            Text(
                              (s.route.originStation?.name ?? s.route.origin)
                                  .toUpperCase(),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey.shade500,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.8,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Column(
                          children: [
                            Container(
                              height: 2,
                              width: 36,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.ethGreen.withValues(alpha: 0.2),
                                    AppColors.ethGreenNeon,
                                    AppColors.ethGreen.withValues(alpha: 0.2),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Icon(Icons.directions_bus_filled_rounded, size: 18, color: AppColors.ethGreenNeon),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              timeFmt.format(s.arrivesAt.toLocal()),
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                            Text(
                              (s.route.destinationStation?.name ??
                                      s.route.destination)
                                  .toUpperCase(),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey.shade500,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.8,
                                  ),
                              textAlign: TextAlign.end,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: compact ? 12 : 14),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: left > 0 ? onBook : null,
                    child: Text(left > 0 ? 'Book now' : 'Sold out'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
