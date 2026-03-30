class ApiException implements Exception {
  ApiException({
    this.status,
    required this.code,
    required this.message,
  });

  final int? status;
  final String code;
  final String message;

  @override
  String toString() => message;
}
