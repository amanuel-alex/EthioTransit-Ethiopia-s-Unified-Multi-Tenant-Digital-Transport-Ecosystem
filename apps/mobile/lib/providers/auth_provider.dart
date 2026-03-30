import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/models/auth_session.dart';
import '../core/storage/token_storage.dart';
import '../data/ethiotransit_repository.dart';

final authSessionProvider =
    AsyncNotifierProvider<AuthNotifier, AuthSession?>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<AuthSession?> {
  @override
  Future<AuthSession?> build() async {
    final storage = ref.read(tokenStorageProvider);
    final access = await storage.readAccessToken();
    final refresh = await storage.readRefreshToken();
    final userRaw = await storage.readUserJson();
    if (access == null || refresh == null || userRaw == null) return null;
    final map = userFromJson(userRaw);
    if (map == null) return null;
    return AuthSession(
      user: AuthUser.fromJson(map),
      accessToken: access,
      refreshToken: refresh,
    );
  }

  Future<void> login(String phone, String code) async {
    state = const AsyncValue.loading();
    try {
      final repo = ref.read(ethiotransitRepositoryProvider);
      final session = await repo.login(phone: phone, code: code);
      state = AsyncValue.data(session);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    await ref.read(ethiotransitRepositoryProvider).logout();
    state = const AsyncValue.data(null);
  }
}
