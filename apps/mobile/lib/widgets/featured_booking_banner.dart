import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/models/booking_models.dart';
import '../features/bookings/bookings_screen.dart';
import '../features/checkout/checkout_screen.dart';
import '../features/ticket/ticket_screen.dart';
import '../theme/app_theme.dart';

/// Highlights the passenger’s next trip with vehicle photo and details.
class FeaturedBookingBanner extends StatelessWidget {
  const FeaturedBookingBanner({super.key, required this.booking, required this.dark});

  final BookingRow booking;
  final bool dark;

  void _open(BuildContext context) {
    final b = booking;
    if (b.status == 'PENDING') {
      Navigator.of(context).push<void>(
        MaterialPageRoute<void>(
          builder: (_) => CheckoutScreen(
            bookingId: b.id,
            totalAmount: b.totalAmount,
            currency: b.currency,
            routeLabel: b.schedule.routeLabel,
            departsAt: b.schedule.departsAt,
            seatNumbers: b.seats,
          ),
        ),
      );
      return;
    }
    if (b.status == 'PAID') {
      Navigator.of(context).push<void>(
        MaterialPageRoute<void>(
          builder: (_) => TicketScreen(bookingId: b.id),
        ),
      );
      return;
    }
    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(builder: (_) => const BookingsScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = booking.schedule;
    final timeFmt = DateFormat.yMMMd().add_jm();
    final url = s.busImageUrl;
    final title = s.busVehicleName?.trim().isNotEmpty == true
        ? s.busVehicleName!.trim()
        : 'Your coach';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _open(context),
        borderRadius: BorderRadius.circular(22),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: AppColors.ethGreenNeon.withValues(alpha: dark ? 0.35 : 0.28),
            ),
            color: dark ? AppColors.cardDark.withValues(alpha: 0.92) : Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: dark ? 0.25 : 0.06),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: SizedBox(
                  width: 102,
                  height: 102,
                  child: url != null && url.isNotEmpty
                      ? Image.network(
                          url,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              _busPlaceholder(dark),
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return ColoredBox(
                              color: dark ? const Color(0xFF0D0D0D) : Colors.grey.shade200,
                              child: const Center(
                                child: SizedBox(
                                  width: 28,
                                  height: 28,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.ethGreen,
                                  ),
                                ),
                              ),
                            );
                          },
                        )
                      : _busPlaceholder(dark),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your trip',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppColors.ethGreenNeon,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.6,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      s.routeLabel,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: dark ? const Color(0xFF9CA3AF) : const Color(0xFF64748B),
                            fontWeight: FontWeight.w600,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Plate ${s.plate}'
                      '${s.busSeatCapacity != null ? ' · ${s.busSeatCapacity} seats' : ''}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    Text(
                      timeFmt.format(s.departsAt.toLocal()),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontSize: 12,
                            color: AppColors.ethGreenNeon.withValues(alpha: 0.9),
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: booking.status == 'PAID'
                              ? AppColors.ethGreen.withValues(alpha: 0.2)
                              : AppColors.ethYellow.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          booking.status,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: Colors.grey.shade500),
            ],
          ),
        ),
      ),
    );
  }

  Widget _busPlaceholder(bool dark) {
    return ColoredBox(
      color: dark ? const Color(0xFF0D0D0D) : Colors.grey.shade200,
      child: Center(
        child: Icon(
          Icons.directions_bus_filled_rounded,
          size: 44,
          color: AppColors.ethGreen.withValues(alpha: 0.75),
        ),
      ),
    );
  }
}
