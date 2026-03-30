import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'features/auth/login_screen.dart';
import 'features/shell/main_shell.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'theme/app_theme.dart';

class EthioTransitApp extends ConsumerWidget {
  const EthioTransitApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dark = ref.watch(darkModeProvider);
    final auth = ref.watch(authSessionProvider);

    return MaterialApp(
      title: 'EthioTransit',
      debugShowCheckedModeBanner: false,
      theme: buildEthioTheme(dark: false),
      darkTheme: buildEthioTheme(dark: true),
      themeMode: dark ? ThemeMode.dark : ThemeMode.light,
      home: auth.when(
        data: (session) {
          if (session == null || !session.isPassenger) {
            return const LoginScreen();
          }
          return const MainShell();
        },
        loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
        error: (e, _) => Scaffold(
          body: Center(child: Text('$e')),
        ),
      ),
    );
  }
}
