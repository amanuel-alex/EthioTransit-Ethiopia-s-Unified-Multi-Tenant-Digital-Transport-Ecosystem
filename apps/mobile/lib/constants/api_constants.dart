import 'package:flutter/foundation.dart';

/// API base URL — override with `--dart-define=API_BASE_URL=https://your-host`
///
/// Defaults by platform (when define is omitted):
/// - **Web (Chrome, etc.)** → `http://localhost:4000` (`10.0.2.2` is only for Android emulator)
/// - **Android** → `http://10.0.2.2:4000` (host loopback from emulator)
/// - **Other (iOS simulator, desktop)** → `http://127.0.0.1:4000`
abstract final class ApiConstants {
  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (fromEnv.isNotEmpty) return fromEnv;
    if (kIsWeb) return 'http://localhost:4000';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000';
    }
    return 'http://127.0.0.1:4000';
  }

  static const String prefix = '/api/v1';
}
