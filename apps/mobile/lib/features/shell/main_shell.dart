import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/ethio_background.dart';
import '../bookings/bookings_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../tickets/tickets_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static const _titles = ['Home', 'Bookings', 'Tickets', 'Profile'];

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final muted = dark ? const Color(0xFF6B7280) : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: EthioBackground(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          child: [
            const HomeScreen(key: ValueKey('home')),
            const BookingsScreen(key: ValueKey('bookings')),
            const TicketsScreen(key: ValueKey('tickets')),
            const ProfileScreen(key: ValueKey('profile')),
          ][_index],
        ),
      ),
      bottomNavigationBar: Material(
        elevation: 0,
        color: dark ? const Color(0xFF0A0A0A).withValues(alpha: 0.92) : Colors.white.withValues(alpha: 0.95),
        child: DecoratedBox(
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(
                color: dark ? AppColors.borderDark.withValues(alpha: 0.6) : Colors.black.withValues(alpha: 0.06),
              ),
            ),
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
              child: Row(
                children: [
                  _NavPill(
                    label: _titles[0],
                    selected: _index == 0,
                    icon: Icons.home_outlined,
                    iconSelected: Icons.home_rounded,
                    muted: muted,
                    onTap: () => setState(() => _index = 0),
                  ),
                  _NavPill(
                    label: _titles[1],
                    selected: _index == 1,
                    icon: Icons.calendar_month_outlined,
                    iconSelected: Icons.calendar_month_rounded,
                    muted: muted,
                    onTap: () => setState(() => _index = 1),
                  ),
                  _NavPill(
                    label: _titles[2],
                    selected: _index == 2,
                    icon: Icons.confirmation_number_outlined,
                    iconSelected: Icons.confirmation_number_rounded,
                    muted: muted,
                    onTap: () => setState(() => _index = 2),
                  ),
                  _NavPill(
                    label: _titles[3],
                    selected: _index == 3,
                    icon: Icons.person_outline_rounded,
                    iconSelected: Icons.person_rounded,
                    muted: muted,
                    onTap: () => setState(() => _index = 3),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavPill extends StatelessWidget {
  const _NavPill({
    required this.label,
    required this.selected,
    required this.icon,
    required this.iconSelected,
    required this.muted,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final IconData icon;
  final IconData iconSelected;
  final Color muted;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 240),
                curve: Curves.easeOutCubic,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: selected ? AppColors.ethGreen.withValues(alpha: 0.22) : Colors.transparent,
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: AppColors.ethGreen.withValues(alpha: 0.35),
                            blurRadius: 18,
                            spreadRadius: 0,
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  selected ? iconSelected : icon,
                  size: 24,
                  color: selected ? AppColors.ethGreenNeon : muted,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? AppColors.ethGreenNeon : muted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
