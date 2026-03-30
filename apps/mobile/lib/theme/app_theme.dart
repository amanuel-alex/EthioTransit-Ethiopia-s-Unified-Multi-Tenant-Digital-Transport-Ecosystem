import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

abstract final class AppColors {
  static const Color ethGreen = Color(0xFF22C55E);
  static const Color ethGreenNeon = Color(0xFF4ADE80);
  static const Color ethGreenDark = Color(0xFF15803D);
  static const Color ethYellow = Color(0xFFFACC15);
  static const Color ethRed = Color(0xFFEF4444);
  static const Color surfaceDark = Color(0xFF050505);
  static const Color cardDark = Color(0xFF141414);
  static const Color cardDarkElevated = Color(0xFF1C1C1C);
  static const Color borderDark = Color(0xFF2A2A2A);
}

ThemeData buildEthioTheme({required bool dark}) {
  final base =
      dark ? ThemeData.dark(useMaterial3: true) : ThemeData.light(useMaterial3: true);
  final green = AppColors.ethGreen;
  final textPrimary = dark ? Colors.white : const Color(0xFF0F172A);
  final textSecondary = dark ? const Color(0xFF9CA3AF) : const Color(0xFF64748B);

  final textTheme = base.textTheme.apply(
    bodyColor: textPrimary,
    displayColor: textPrimary,
  );

  return base.copyWith(
    colorScheme: base.colorScheme.copyWith(
      primary: green,
      onPrimary: Colors.black,
      secondary: AppColors.ethYellow,
      tertiary: AppColors.ethRed,
      surface: dark ? AppColors.surfaceDark : base.colorScheme.surface,
      onSurface: textPrimary,
      surfaceContainerHighest: dark ? AppColors.cardDarkElevated : base.colorScheme.surfaceContainerHighest,
    ),
    scaffoldBackgroundColor: dark ? Colors.transparent : const Color(0xFFF1F5F9),
    textTheme: textTheme.copyWith(
      headlineSmall: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.5),
      titleLarge: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
      titleMedium: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      labelSmall: textTheme.labelSmall?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: 1.1,
        color: AppColors.ethGreenNeon,
      ),
    ),
    appBarTheme: AppBarTheme(
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: Colors.transparent,
      foregroundColor: textPrimary,
      systemOverlayStyle: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
    ),
    cardTheme: CardThemeData(
      color: dark ? AppColors.cardDark : Colors.white,
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: dark ? 0.45 : 0.08),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: dark ? AppColors.borderDark.withValues(alpha: 0.9) : Colors.black12),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: dark ? const Color(0xFF0D0D0D) : Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: TextStyle(color: textSecondary.withValues(alpha: 0.7)),
      labelStyle: TextStyle(color: textSecondary, fontSize: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(18)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(
          color: dark ? AppColors.borderDark : Colors.grey.shade300,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: green, width: 2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: green,
        foregroundColor: Colors.black,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.2),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: dark ? Colors.white : null,
        side: BorderSide(color: dark ? AppColors.borderDark : Colors.grey),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 72,
      backgroundColor: dark ? const Color(0xFF0A0A0A) : null,
      indicatorColor: green.withValues(alpha: 0.2),
      labelTextStyle: WidgetStateProperty.resolveWith((s) {
        if (s.contains(WidgetState.selected)) {
          return TextStyle(color: green, fontWeight: FontWeight.w600, fontSize: 12);
        }
        return TextStyle(color: textSecondary, fontSize: 12);
      }),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: dark ? AppColors.cardDarkElevated : Colors.grey.shade100,
      side: BorderSide(color: dark ? AppColors.borderDark : Colors.grey.shade300),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      labelStyle: TextStyle(
        color: dark ? Colors.white : Colors.black87,
        fontWeight: FontWeight.w500,
        fontSize: 13,
      ),
    ),
  );
}
