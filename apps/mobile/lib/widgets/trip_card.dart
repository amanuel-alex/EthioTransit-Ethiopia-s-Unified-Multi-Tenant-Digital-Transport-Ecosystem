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

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onBook,
        child: Padding(
          padding: EdgeInsets.all(compact ? 12 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      hit.companyName,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: AppColors.ethGreen,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ),
                  Text(
                    '$price ETB',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '${s.route.origin} → ${s.route.destination}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.schedule, size: 16, color: Colors.grey.shade500),
                  const SizedBox(width: 6),
                  Text(
                    '${timeFmt.format(s.departsAt)} → ${timeFmt.format(s.arrivesAt)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const Spacer(),
                  if (left <= 8 && left > 0)
                    Text(
                      '$left seats left',
                      style: TextStyle(
                        color: left <= 4 ? AppColors.ethRed : AppColors.ethYellow,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  else
                    Text(
                      '$left left',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
              const SizedBox(height: 12),
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
    );
  }
}
