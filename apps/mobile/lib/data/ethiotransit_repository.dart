import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/api_constants.dart';
import '../core/models/auth_session.dart';
import '../core/models/booking_models.dart';
import '../core/models/route_search_row.dart';
import '../core/models/schedule_detail.dart';
import '../core/storage/token_storage.dart';
import 'api_exception.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final ethiotransitRepositoryProvider = Provider<EthiotransitRepository>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  return EthiotransitRepository(storage: storage);
});

class EthiotransitRepository {
  EthiotransitRepository({required TokenStorage storage}) : _storage = storage {
    _dio = Dio(
      BaseOptions(
        baseUrl: '${ApiConstants.baseUrl}${ApiConstants.prefix}',
        connectTimeout: const Duration(seconds: 25),
        receiveTimeout: const Duration(seconds: 25),
        headers: {'Accept': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final p = options.path;
          if (p != '/auth/login' && p != '/auth/refresh') {
            final t = await _storage.readAccessToken();
            if (t != null) options.headers['Authorization'] = 'Bearer $t';
          }
          return handler.next(options);
        },
        onError: (e, handler) async {
          final path = e.requestOptions.path;
          if (e.response?.statusCode == 401 &&
              path != '/auth/refresh' &&
              path != '/auth/login') {
            final rotated = await _tryRefresh();
            if (rotated) {
              final opts = e.requestOptions;
              final t = await _storage.readAccessToken();
              opts.headers['Authorization'] = 'Bearer $t';
              try {
                final clone = await _dio.fetch(opts);
                return handler.resolve(clone);
              } catch (err) {
                if (err is DioException) return handler.next(err);
              }
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  late final Dio _dio;
  final TokenStorage _storage;

  Future<bool> _tryRefresh() async {
    final refresh = await _storage.readRefreshToken();
    if (refresh == null) return false;
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refresh},
        options: Options(headers: Map<String, dynamic>.from({})),
      );
      final data = res.data!;
      final access = data['accessToken'] as String;
      final nextRefresh = data['refreshToken'] as String;
      final userRaw = await _storage.readUserJson();
      if (userRaw == null) return false;
      await _storage.saveSession(
        accessToken: access,
        refreshToken: nextRefresh,
        userJson: userRaw,
      );
      return true;
    } catch (_) {
      await _storage.clear();
      return false;
    }
  }

  ApiException _toApi(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      final msg = data['message'] as String? ?? e.message ?? 'Request failed';
      final code = data['code'] as String? ?? 'http_error';
      return ApiException(status: e.response?.statusCode, code: code, message: msg);
    }
    return ApiException(
      status: e.response?.statusCode,
      code: 'network',
      message: e.message ?? 'Network error',
    );
  }

  Future<AuthSession> login({required String phone, required String code}) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'phone': phone, 'code': code},
      );
      final data = res.data!;
      final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      final session = AuthSession(
        user: user,
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      await _storage.saveSession(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        userJson: jsonEncode(user.toJson()),
      );
      return session;
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<void> logout() => _storage.clear();

  Future<List<RouteSearchRow>> searchRoutes({
    required String origin,
    required String destination,
    String? date,
  }) async {
    try {
      final q = <String, dynamic>{
        'origin': origin,
        'destination': destination,
        if (date != null && date.isNotEmpty) 'date': date,
      };
      final res = await _dio.get<Map<String, dynamic>>('/routes/search', queryParameters: q);
      final list = res.data!['data'] as List<dynamic>;
      return list.map((e) => RouteSearchRow.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  /// Local calendar day → UTC ISO range (same idea as web `localDayRangeToIso`).
  static Map<String, String> dayRangeIso(DateTime localDay) {
    final start = DateTime(localDay.year, localDay.month, localDay.day);
    final end = DateTime(localDay.year, localDay.month, localDay.day, 23, 59, 59, 999);
    return {
      'from': start.toUtc().toIso8601String(),
      'to': end.toUtc().toIso8601String(),
    };
  }

  Future<List<ScheduleDetail>> schedulesForRoute({
    required String routeId,
    required DateTime travelDate,
  }) async {
    final range = dayRangeIso(travelDate);
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/schedules/available',
        queryParameters: {
          'routeId': routeId,
          'from': range['from'],
          'to': range['to'],
        },
      );
      final list = res.data!['data'] as List<dynamic>;
      return list.map((e) => ScheduleDetail.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<List<TripHit>> searchTrips({
    required String origin,
    required String destination,
    required DateTime travelDate,
  }) async {
    final routes = await searchRoutes(
      origin: origin,
      destination: destination,
      date:
          '${travelDate.year.toString().padLeft(4, '0')}-${travelDate.month.toString().padLeft(2, '0')}-${travelDate.day.toString().padLeft(2, '0')}',
    );
    if (routes.isEmpty) return [];
    final batches = await Future.wait(
      routes.map((r) async {
        try {
          final scheds = await schedulesForRoute(routeId: r.id, travelDate: travelDate);
          return scheds.map(
            (d) => TripHit(detail: d, companyName: r.companyName),
          );
        } catch (_) {
          return <TripHit>[];
        }
      }),
    );
    final flat = batches.expand((x) => x).toList()
      ..sort((a, b) => a.detail.schedule.departsAt.compareTo(b.detail.schedule.departsAt));
    return flat;
  }

  Future<List<TripHit>> upcomingTrips({int limit = 9}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/schedules/upcoming',
        queryParameters: {'limit': limit},
      );
      final list = res.data!['data'] as List<dynamic>;
      return list.map((e) => TripHit.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<ScheduleDetail> scheduleAvailability(String scheduleId) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/schedules/available',
        queryParameters: {'scheduleId': scheduleId},
      );
      return ScheduleDetail.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<CreateBookingResult> createBooking({
    required String scheduleId,
    required List<int> seats,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/bookings/create',
        data: {'scheduleId': scheduleId, 'seats': seats},
      );
      final b = res.data!['booking'] as Map<String, dynamic>;
      return CreateBookingResult(
        id: b['id'] as String,
        status: b['status'] as String,
        totalAmount: b['totalAmount'].toString(),
        currency: 'ETB',
        seats: (b['seats'] as List<dynamic>).map((e) => (e as num).toInt()).toList(),
      );
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<List<BookingRow>> listUserBookings() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/bookings/user');
      final list = res.data!['data'] as List<dynamic>;
      return list.map((e) => BookingRow.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<BookingRow?> bookingById(String id) async {
    final all = await listUserBookings();
    try {
      return all.firstWhere((b) => b.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> initiateMpesa({
    required String bookingId,
    required String phoneNumber,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/payments/mpesa/initiate',
        data: {'bookingId': bookingId, 'phoneNumber': phoneNumber},
      );
      return res.data!;
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }

  Future<Map<String, dynamic>> initiateChapa({
    required String bookingId,
    required String email,
    String? firstName,
    String? lastName,
  }) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/payments/chapa/initiate',
        data: {
          'bookingId': bookingId,
          'email': email,
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
        },
      );
      return res.data!;
    } on DioException catch (e) {
      throw _toApi(e);
    }
  }
}
