import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Unsplash photo (bundled): coach on the road — same vibe as web trip cards.
/// https://unsplash.com/photos/photo-1544620347-c4fd4a3d5957
const String kCoachHeroAsset = 'assets/images/coach_hero.jpg';

class HomeCoachHero extends StatelessWidget {
  const HomeCoachHero({super.key, required this.dark});

  final bool dark;

  @override
  Widget build(BuildContext context) {
    final textPrimary = dark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = dark ? const Color(0xFFE2E8F0) : const Color(0xFF475569);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: AppColors.ethGreenNeon.withValues(alpha: dark ? 0.28 : 0.22),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.ethGreen.withValues(alpha: dark ? 0.14 : 0.1),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(21),
        child: SizedBox(
          height: 152,
          width: double.infinity,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                kCoachHeroAsset,
                fit: BoxFit.cover,
                alignment: const Alignment(0.32, -0.05),
                errorBuilder: (context, error, stackTrace) => ColoredBox(
                  color: AppColors.ethGreen.withValues(alpha: dark ? 0.2 : 0.12),
                  child: Center(
                    child: CustomPaint(
                      size: const Size(232, 104),
                      painter: _CoachIllustrationPainter(dark: dark),
                    ),
                  ),
                ),
              ),
              // Readability: strong scrim on the left for copy
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: dark
                        ? [
                            const Color(0xE6161820),
                            const Color(0x99161820),
                            const Color(0x33161820),
                            Colors.transparent,
                          ]
                        : [
                            const Color(0xF5F8FAFC),
                            const Color(0xCCF8FAFC),
                            const Color(0x66FFFFFF),
                            Colors.transparent,
                          ],
                    stops: const [0.0, 0.35, 0.62, 1.0],
                  ),
                ),
              ),
              // Brand tint at bottom
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                height: 48,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        AppColors.ethGreenDark.withValues(alpha: dark ? 0.35 : 0.18),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 16,
                top: 12,
                right: 100,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: dark
                                ? Colors.black.withValues(alpha: 0.35)
                                : Colors.white.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: AppColors.ethGreenNeon.withValues(alpha: 0.45),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.directions_bus_filled_rounded,
                                size: 16,
                                color: AppColors.ethGreenNeon.withValues(alpha: 0.95),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Intercity',
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: AppColors.ethGreenNeon,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.4,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Travel in comfort',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                            letterSpacing: -0.3,
                            shadows: dark
                                ? [
                                    Shadow(
                                      color: Colors.black.withValues(alpha: 0.65),
                                      blurRadius: 10,
                                    ),
                                  ]
                                : null,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Pick your city & terminal — we’ll find the bus.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: textSecondary,
                            height: 1.25,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            shadows: dark
                                ? [
                                    Shadow(
                                      color: Colors.black.withValues(alpha: 0.55),
                                      blurRadius: 8,
                                    ),
                                  ]
                                : null,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CoachIllustrationPainter extends CustomPainter {
  _CoachIllustrationPainter({required this.dark});

  final bool dark;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width * 0.42;
    final cy = size.height * 0.52;

    final glow = Paint()
      ..shader = RadialGradient(
        colors: [
          AppColors.ethGreenNeon.withValues(alpha: 0.28),
          AppColors.ethGreen.withValues(alpha: 0.05),
          Colors.transparent,
        ],
        stops: const [0.0, 0.45, 1.0],
      ).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: size.height * 0.9));
    canvas.drawCircle(Offset(cx, cy), size.height * 0.85, glow);

    final bodyPaint = Paint()
      ..color = dark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)
      ..style = PaintingStyle.fill;

    final bodyStroke = Paint()
      ..color = dark ? AppColors.ethGreenNeon.withValues(alpha: 0.35) : AppColors.ethGreenDark.withValues(alpha: 0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final accent = Paint()
      ..color = AppColors.ethGreenNeon.withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;

    final glass = Paint()
      ..color = dark ? const Color(0xFF0F172A).withValues(alpha: 0.75) : const Color(0xFF38BDF8).withValues(alpha: 0.35)
      ..style = PaintingStyle.fill;

    final wheelFill = Paint()
      ..color = dark ? const Color(0xFF0A0A0A) : const Color(0xFF334155)
      ..style = PaintingStyle.fill;

    final wheelRim = Paint()
      ..color = dark ? const Color(0xFF3F3F46) : const Color(0xFF64748B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final bodyRect = RRect.fromRectAndCorners(
      Rect.fromLTWH(size.width * 0.08, size.height * 0.28, size.width * 0.82, size.height * 0.38),
      topLeft: const Radius.circular(10),
      topRight: const Radius.circular(14),
      bottomLeft: const Radius.circular(8),
      bottomRight: const Radius.circular(8),
    );
    canvas.drawRRect(bodyRect, bodyPaint);
    canvas.drawRRect(bodyRect, bodyStroke);

    final stripe = RRect.fromRectAndRadius(
      Rect.fromLTWH(size.width * 0.12, size.height * 0.26, size.width * 0.68, size.height * 0.06),
      const Radius.circular(4),
    );
    canvas.drawRRect(stripe, accent);

    final windPath = Path()
      ..moveTo(size.width * 0.78, size.height * 0.30)
      ..lineTo(size.width * 0.94, size.height * 0.34)
      ..lineTo(size.width * 0.94, size.height * 0.56)
      ..lineTo(size.width * 0.78, size.height * 0.58)
      ..close();
    canvas.drawPath(windPath, glass);
    canvas.drawPath(windPath, bodyStroke);

    for (var i = 0; i < 5; i++) {
      final left = size.width * (0.14 + i * 0.11);
      final win = RRect.fromRectAndRadius(
        Rect.fromLTWH(left, size.height * 0.36, size.width * 0.08, size.height * 0.2),
        const Radius.circular(3),
      );
      canvas.drawRRect(win, glass);
    }

    canvas.drawCircle(
      Offset(size.width * 0.92, size.height * 0.48),
      3.2,
      Paint()..color = AppColors.ethYellow.withValues(alpha: 0.95),
    );

    void wheel(Offset o) {
      canvas.drawCircle(o, size.height * 0.14, wheelFill);
      canvas.drawCircle(o, size.height * 0.14, wheelRim);
      canvas.drawCircle(o, size.height * 0.06, Paint()..color = dark ? const Color(0xFF52525B) : const Color(0xFF94A3B8));
    }

    wheel(Offset(size.width * 0.28, size.height * 0.72));
    wheel(Offset(size.width * 0.62, size.height * 0.72));

    final road = Paint()
      ..color = (dark ? Colors.white : Colors.black).withValues(alpha: 0.08)
      ..strokeWidth = 2;
    canvas.drawLine(
      Offset(size.width * 0.02, size.height * 0.88),
      Offset(size.width * 0.98, size.height * 0.88),
      road,
    );
    for (var x = size.width * 0.1; x < size.width * 0.95; x += 18) {
      canvas.drawLine(Offset(x, size.height * 0.88), Offset(x + 8, size.height * 0.88), road);
    }

    final motion = Paint()
      ..color = AppColors.ethGreenNeon.withValues(alpha: 0.15)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < 3; i++) {
      final y = size.height * (0.42 + i * 0.06);
      canvas.drawLine(Offset(size.width * 0.02, y), Offset(size.width * 0.06, y), motion);
    }
  }

  @override
  bool shouldRepaint(covariant _CoachIllustrationPainter oldDelegate) => oldDelegate.dark != dark;
}
