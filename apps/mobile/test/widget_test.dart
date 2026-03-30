import 'package:ethiotransit_mobile/app.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App builds with MaterialApp', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: EthioTransitApp(),
      ),
    );
    await tester.pump();
    expect(find.byType(EthioTransitApp), findsOneWidget);
  });
}
