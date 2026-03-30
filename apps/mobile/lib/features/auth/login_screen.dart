import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phone = TextEditingController(text: '+251900000003');
  final _code = TextEditingController(text: '123456');
  final _phoneFocus = FocusNode();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    _phoneFocus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _submitting = true;
    });
    try {
      await ref.read(authSessionProvider.notifier).login(_phone.text.trim(), _code.text.trim());
      if (!mounted) return;
      final s = ref.read(authSessionProvider).valueOrNull;
      if (s != null && !s.isPassenger) {
        setState(() {
          _error = 'Passenger accounts only in this app.';
          _submitting = false;
        });
        await ref.read(authSessionProvider.notifier).logout();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : e.toString();
        _submitting = false;
      });
    }
    if (mounted) setState(() => _submitting = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(
                'EthioTransit',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.ethGreen,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Where are you going?',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in with your phone. Use the dev code from the API (AUTH_DEV_CODE).',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: cs.onSurface.withValues(alpha: 0.7),
                    ),
              ),
              const SizedBox(height: 40),
              TextField(
                controller: _phone,
                focusNode: _phoneFocus,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone number',
                  hintText: '+2519…',
                  prefixIcon: Icon(Icons.phone_rounded),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _code,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Verification code',
                  hintText: 'OTP / dev code',
                  prefixIcon: Icon(Icons.lock_outline_rounded),
                ),
                onSubmitted: (_) => _submitting ? null : _submit(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(_error!, style: TextStyle(color: cs.error)),
              ],
              const SizedBox(height: 28),
              FilledButton(
                onPressed: _submitting || _phone.text.trim().isEmpty ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
