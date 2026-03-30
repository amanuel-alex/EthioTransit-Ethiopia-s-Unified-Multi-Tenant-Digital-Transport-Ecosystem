import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../constants/api_constants.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_theme.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authSessionProvider).asData?.value;
    final dark = ref.watch(darkModeProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Profile',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Account & preferences',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.65),
                  ),
            ),
            const SizedBox(height: 22),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppColors.ethGreen.withValues(alpha: 0.2),
                      child: const Icon(Icons.person_rounded, color: AppColors.ethGreenNeon),
                    ),
                    title: const Text('Phone'),
                    subtitle: Text(auth?.user.phone ?? '—'),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: Icon(Icons.badge_outlined, color: Colors.grey.shade500),
                    title: const Text('Role'),
                    subtitle: Text(auth?.user.role ?? '—'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Card(
              child: SwitchListTile(
                secondary: Icon(dark ? Icons.dark_mode_rounded : Icons.light_mode_rounded),
                title: const Text('Dark mode'),
                subtitle: Text(dark ? 'Easy on the eyes at night' : 'Light surfaces'),
                value: dark,
                activeThumbColor: AppColors.ethGreenNeon,
                onChanged: (v) => ref.read(darkModeProvider.notifier).setDark(v),
              ),
            ),
            const SizedBox(height: 14),
            Card(
              child: ListTile(
                leading: Icon(Icons.dns_outlined, color: Colors.grey.shade500),
                title: const Text('API base'),
                subtitle: Text(ApiConstants.baseUrl, style: const TextStyle(fontSize: 12)),
              ),
            ),
            const SizedBox(height: 28),
            FilledButton.tonal(
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                foregroundColor: AppColors.ethRed,
              ),
              onPressed: () async {
                await ref.read(authSessionProvider.notifier).logout();
              },
              child: const Text('Log out'),
            ),
          ],
        ),
      ),
    );
  }
}
