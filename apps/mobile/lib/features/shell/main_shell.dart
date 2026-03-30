import 'package:flutter/material.dart';

import '../bookings/bookings_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';
import '../tickets/tickets_screen.dart';
import '../../theme/app_theme.dart';

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
    return Scaffold(
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 280),
        child: [
          const HomeScreen(key: ValueKey('home')),
          const BookingsScreen(key: ValueKey('bookings')),
          const TicketsScreen(key: ValueKey('tickets')),
          const ProfileScreen(key: ValueKey('profile')),
        ][_index],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded, color: AppColors.ethGreen),
            label: _titles[0],
          ),
          NavigationDestination(
            icon: const Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month, color: AppColors.ethGreen),
            label: _titles[1],
          ),
          NavigationDestination(
            icon: const Icon(Icons.confirmation_number_outlined),
            selectedIcon: Icon(Icons.confirmation_number, color: AppColors.ethGreen),
            label: _titles[2],
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person, color: AppColors.ethGreen),
            label: _titles[3],
          ),
        ],
      ),
    );
  }
}
