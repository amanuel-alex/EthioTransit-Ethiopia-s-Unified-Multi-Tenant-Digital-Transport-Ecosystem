import 'package:flutter_test/flutter_test.dart';

import 'package:ethiotransit_mobile/main.dart';

void main() {
  testWidgets('Home screen shows EthioTransit', (WidgetTester tester) async {
    await tester.pumpWidget(const EthioTransitApp());
    expect(find.text('EthioTransit'), findsWidgets);
    expect(find.textContaining('M-Pesa'), findsOneWidget);
  });
}
