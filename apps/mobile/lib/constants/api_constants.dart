/// API base URL — override with `--dart-define=API_BASE_URL=https://your-host`
/// Android emulator → `http://10.0.2.2:4000` (localhost on host)
/// iOS simulator → `http://127.0.0.1:4000`
abstract final class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000',
  );

  static const String prefix = '/api/v1';
}
