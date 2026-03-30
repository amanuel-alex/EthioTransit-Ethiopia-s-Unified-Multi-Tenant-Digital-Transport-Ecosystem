import 'package:flutter/material.dart';

abstract final class AppColors {
  static const Color ethGreen = Color(0xFF16A34A);
  static const Color ethGreenDark = Color(0xFF15803D);
  static const Color ethYellow = Color(0xFFFBBF24);
  static const Color ethRed = Color(0xFFDC2626);
  static const Color surfaceDark = Color(0xFF0F0F0F);
  static const Color cardDark = Color(0xFF1A1A1A);
  static const Color borderDark = Color(0xFF2A2A2A);
}

ThemeData buildEthioTheme({required bool dark}) {
  final base = dark ? ThemeData.dark() : ThemeData.light();
  final green = AppColors.ethGreen;
  return base.copyWith(
    useMaterial3: true,
    colorScheme: base.colorScheme.copyWith(
      primary: green,
      secondary: AppColors.ethYellow,
      tertiary: AppColors.ethRed,
      surface: dark ? AppColors.surfaceDark : base.colorScheme.surface,
    ),
    scaffoldBackgroundColor:
        dark ? AppColors.surfaceDark : base.scaffoldBackgroundColor,
    appBarTheme: AppBarTheme(
      centerTitle: false,
      elevation: 0,
      backgroundColor: dark ? AppColors.surfaceDark : null,
      foregroundColor: dark ? Colors.white : null,
    ),
    cardTheme: CardThemeData(
      color: dark ? AppColors.cardDark : null,
      elevation: dark ? 0 : 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      shadowColor: dark ? Colors.black54 : null,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: dark ? const Color(0xFF141414) : null,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: dark ? AppColors.borderDark : Colors.grey.shade300,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: green, width: 2),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: green,
        foregroundColor: Colors.black,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: dark ? Colors.white : null,
        side: BorderSide(color: dark ? AppColors.borderDark : Colors.grey),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    ),
  );
}
