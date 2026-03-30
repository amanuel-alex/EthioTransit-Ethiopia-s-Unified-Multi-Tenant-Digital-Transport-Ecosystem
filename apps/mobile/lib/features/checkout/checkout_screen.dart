import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/api_exception.dart';
import '../../data/ethiotransit_repository.dart';
import '../ticket/payment_waiting_screen.dart';
import '../ticket/ticket_screen.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({
    super.key,
    required this.bookingId,
    required this.totalAmount,
    required this.currency,
    required this.routeLabel,
    required this.departsAt,
    required this.seatNumbers,
  });

  final String bookingId;
  final String totalAmount;
  final String currency;
  final String routeLabel;
  final DateTime departsAt;
  final List<int> seatNumbers;

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _mpesa = TextEditingController(text: '254700000000');
  final _email = TextEditingController(text: 'you@example.com');
  bool _mpesaBusy = false;
  bool _chapaBusy = false;

  @override
  void dispose() {
    _mpesa.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _mpesaPay() async {
    setState(() => _mpesaBusy = true);
    try {
      final out = await ref.read(ethiotransitRepositoryProvider).initiateMpesa(
            bookingId: widget.bookingId,
            phoneNumber: _mpesa.text.trim(),
          );
      final mock = out['mock'] == true;
      if (!mounted) return;
      if (mock) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Test mode: booking marked paid.')),
        );
        Navigator.of(context).pushReplacement(
          MaterialPageRoute<void>(
            builder: (_) => TicketScreen(bookingId: widget.bookingId),
          ),
        );
        return;
      }
      await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (_) => PaymentWaitingScreen(bookingId: widget.bookingId),
        ),
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => TicketScreen(bookingId: widget.bookingId),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e is ApiException ? e.message : '$e')),
      );
    } finally {
      if (mounted) setState(() => _mpesaBusy = false);
    }
  }

  Future<void> _chapaPay() async {
    setState(() => _chapaBusy = true);
    try {
      final out = await ref.read(ethiotransitRepositoryProvider).initiateChapa(
            bookingId: widget.bookingId,
            email: _email.text.trim(),
          );
      final mock = out['mock'] == true;
      final url = out['checkoutUrl'] as String? ?? '';
      if (!mounted) return;
      if (mock) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Test mode: booking marked paid.')),
        );
        Navigator.of(context).pushReplacement(
          MaterialPageRoute<void>(
            builder: (_) => TicketScreen(bookingId: widget.bookingId),
          ),
        );
        return;
      }
      if (url.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No checkout URL from server.')),
        );
        return;
      }
      final uri = Uri.parse(url);
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!mounted) return;
      if (!ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open checkout: $url')),
        );
      }
      await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (_) => PaymentWaitingScreen(bookingId: widget.bookingId),
        ),
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => TicketScreen(bookingId: widget.bookingId),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e is ApiException ? e.message : '$e')),
      );
    } finally {
      if (mounted) setState(() => _chapaBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final df = DateFormat.yMMMd().add_jm();
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Trip summary', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(widget.routeLabel),
                  Text('Departs ${df.format(widget.departsAt.toLocal())}'),
                  Text('Seats: ${widget.seatNumbers.join(", ")}'),
                  const SizedBox(height: 12),
                  Text(
                    '${widget.totalAmount} ${widget.currency}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _mpesa,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'M-Pesa phone',
              hintText: '2547…',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email (Chapa)',
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _mpesaBusy ? null : _mpesaPay,
            child: _mpesaBusy
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('M-Pesa STK'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _chapaBusy ? null : _chapaPay,
            child: _chapaBusy
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Chapa'),
          ),
        ],
      ),
    );
  }
}
