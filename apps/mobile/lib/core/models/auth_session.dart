class AuthUser {
  const AuthUser({
    required this.id,
    required this.phone,
    required this.role,
    this.companyId,
  });

  final String id;
  final String phone;
  final String role;
  final String? companyId;

  factory AuthUser.fromJson(Map<String, dynamic> j) {
    return AuthUser(
      id: j['id'] as String,
      phone: j['phone'] as String,
      role: j['role'] as String,
      companyId: j['companyId'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'role': role,
        'companyId': companyId,
      };
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  final AuthUser user;
  final String accessToken;
  final String refreshToken;

  bool get isPassenger => user.role == 'PASSENGER';
}
