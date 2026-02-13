/**
 * Design tokens and theme constants.
 */

export const colors = {
  // ── Brand ───────────────────────────────────────
  primary: '#6366F1',      // Indigo 500
  primaryLight: '#A5B4FC',  // Indigo 300
  primaryDark: '#4338CA',   // Indigo 700

  // ── Semantic ────────────────────────────────────
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // ── Neutral ─────────────────────────────────────
  background: '#0F172A',    // Slate 900
  surface: '#1E293B',       // Slate 800
  surfaceLight: '#334155',  // Slate 700
  textPrimary: '#F8FAFC',   // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#64748B',     // Slate 500
  border: '#334155',        // Slate 700
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const;

export type ThemeColors = typeof colors;
