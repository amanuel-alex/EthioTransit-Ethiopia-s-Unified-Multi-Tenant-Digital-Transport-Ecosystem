import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../constants/api_constants.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authSessionProvider).asData?.value;
    final dark = ref.watch(darkModeProvider);

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Profile',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 24),
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: const Text('Phone'),
              subtitle: Text(auth?.user.phone ?? '—'),
            ),
            ListTile(
              leading: const Icon(Icons.badge_outlined),
              title: const Text('Role'),
              subtitle: Text(auth?.user.role ?? '—'),
            ),
            SwitchListTile(
              secondary: Icon(dark ? Icons.dark_mode : Icons.light_mode),
              title: const Text('Dark mode'),
              value: dark,
              onChanged: (v) => ref.read(darkModeProvider.notifier).setDark(v),
            ),
            ListTile(
              leading: const Icon(Icons.dns_outlined),
              title: const Text('API base'),
              subtitle: Text(ApiConstants.baseUrl),
            ),
            const SizedBox(height: 24),
            FilledButton.tonal(
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
