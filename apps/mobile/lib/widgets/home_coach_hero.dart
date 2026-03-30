import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Coach — Unsplash (bundled). https://unsplash.com/photos/photo-1544620347-c4fd4a3d5957
const String kCoachHeroAsset = 'assets/images/coach_hero.jpg';

/// Car — Unsplash (bundled). https://unsplash.com/photos/photo-1503376780353-7e6692767b70
const String kCarHeroAsset = 'assets/images/car_hero.jpg';

/// Side-by-side **bus** + **car** heroes: full photos with labels only in a bottom strip.
class TransportHeroRow extends StatelessWidget {
  const TransportHeroRow({super.key, required this.dark});

  final bool dark;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _TransportTile(
            dark: dark,
            asset: kCoachHeroAsset,
            imageAlignment: const Alignment(0.55, -0.06),
            icon: Icons.directions_bus_filled_rounded,
            badge: 'Intercity',
            title: 'Bus',
            subtitle: 'City ↔ city · terminals',
            errorChild: ColoredBox(
              color: AppColors.ethGreen.withValues(alpha: dark ? 0.2 : 0.12),
              child: Center(
                child: CustomPaint(
                  size: const Size(160, 80),
                  painter: _CoachIllustrationPainter(dark: dark),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _TransportTile(
            dark: dark,
            asset: kCarHeroAsset,
            imageAlignment: const Alignment(0.1, 0.15),
            icon: Icons.directions_car_rounded,
            badge: 'Car',
            title: 'Car',
            subtitle: 'Style on the open road',
            errorChild: ColoredBox(
              color: AppColors.ethGreen.withValues(alpha: dark ? 0.18 : 0.1),
              child: Center(
                child: Icon(
                  Icons.directions_car_rounded,
                  size: 56,
                  color: AppColors.ethGreenNeon.withValues(alpha: 0.65),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Kept for existing imports — renders [TransportHeroRow].
class HomeCoachHero extends StatelessWidget {
  const HomeCoachHero({super.key, required this.dark});

  final bool dark;

  @override
  Widget build(BuildContext context) => TransportHeroRow(dark: dark);
}

class _TransportTile extends StatelessWidget {
  const _TransportTile({
    required this.dark,
    required this.asset,
    required this.imageAlignment,
    required this.icon,
    required this.badge,
    required this.title,
    required this.subtitle,
    required this.errorChild,
  });

  final bool dark;
  final String asset;
  final Alignment imageAlignment;
  final IconData icon;
  final String badge;
  final String title;
  final String subtitle;
  final Widget errorChild;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 168,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.ethGreenNeon.withValues(alpha: dark ? 0.28 : 0.22),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.ethGreen.withValues(alpha: dark ? 0.12 : 0.08),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            asset,
            fit: BoxFit.cover,
            alignment: imageAlignment,
            errorBuilder: (context, error, stackTrace) => errorChild,
          ),
          // Bottom readability strip only — vehicle stays visible above
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: dark ? 0.55 : 0.5),
                    Colors.black.withValues(alpha: dark ? 0.82 : 0.78),
                  ],
                  stops: const [0.0, 0.45, 1.0],
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 20, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Icon(icon, size: 15, color: AppColors.ethGreenNeon),
                        const SizedBox(width: 5),
                        Text(
                          badge,
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: AppColors.ethGreenNeon,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.35,
                                fontSize: 10,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.2,
                            shadows: [
                              Shadow(
                                color: Colors.black.withValues(alpha: 0.45),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.88),
                            fontSize: 11,
                            height: 1.2,
                            fontWeight: FontWeight.w500,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
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
