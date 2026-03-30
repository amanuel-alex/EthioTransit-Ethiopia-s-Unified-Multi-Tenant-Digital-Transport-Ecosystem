import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kTheme = 'ethiotransit_theme_dark';

final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) async {
  return SharedPreferences.getInstance();
});

final darkModeProvider = NotifierProvider<DarkModeNotifier, bool>(DarkModeNotifier.new);

class DarkModeNotifier extends Notifier<bool> {
  @override
  bool build() {
    Future.microtask(_load);
    return true;
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final v = prefs.getBool(_kTheme);
    state = v ?? true;
  }

  Future<void> setDark(bool dark) async {
    state = dark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kTheme, dark);
  }
}

final themeModeListenable = Provider<ThemeMode>((ref) {
  final dark = ref.watch(darkModeProvider);
  return dark ? ThemeMode.dark : ThemeMode.light;
});
