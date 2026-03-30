import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kAccess = 'ethiotransit_access';
const _kRefresh = 'ethiotransit_refresh';
const _kUser = 'ethiotransit_user_json';

class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
      : _s = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _s;

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required String userJson,
  }) async {
    await _s.write(key: _kAccess, value: accessToken);
    await _s.write(key: _kRefresh, value: refreshToken);
    await _s.write(key: _kUser, value: userJson);
  }

  Future<String?> readAccessToken() => _s.read(key: _kAccess);
  Future<String?> readRefreshToken() => _s.read(key: _kRefresh);
  Future<String?> readUserJson() => _s.read(key: _kUser);

  Future<void> clear() async {
    await _s.delete(key: _kAccess);
    await _s.delete(key: _kRefresh);
    await _s.delete(key: _kUser);
  }
}

String userToJson(Map<String, dynamic> user) => jsonEncode(user);

Map<String, dynamic>? userFromJson(String? raw) {
  if (raw == null || raw.isEmpty) return null;
  try {
    return jsonDecode(raw) as Map<String, dynamic>;
  } catch (_) {
    return null;
  }
}
