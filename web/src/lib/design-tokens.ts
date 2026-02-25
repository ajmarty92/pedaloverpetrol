/**
 * Design tokens for PedalOverPetrol.
 *
 * These mirror the Tailwind config and provide a single importable reference
 * for components that need token values in JS (e.g. Recharts, inline styles).
 * For normal components, use the Tailwind class equivalents directly.
 */

export const palette = {
  brand: {
    DEFAULT: "#FF7A00",
    50: "#FFF3E6",
    100: "#FFE0B3",
    200: "#FFCC80",
    300: "#FFB84D",
    400: "#FFA41A",
    500: "#FF7A00",
    600: "#E06C00",
    700: "#B35600",
    800: "#804000",
    900: "#4D2600",
  },

  shell: "#0A0A0A",
  surface: "#FFFFFF",
  surfaceMuted: "#F9FAFB",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textOnDark: "#FFFFFF",
  textOnDarkSecondary: "#9CA3AF",

  success: "#16A34A",
  successBg: "#F0FDF4",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  info: "#2563EB",
  infoBg: "#EFF6FF",
} as const;

export const chartColors = {
  delivered: palette.brand.DEFAULT,
  failed: palette.danger,
  primary: palette.brand.DEFAULT,
  grid: "#F0F0F0",
  axis: "#E5E5E5",
  tick: "#888888",
} as const;

export const spacing = {
  page: "px-6 py-6",
  pageCompact: "px-4 py-4 sm:px-6 sm:py-6",
  section: "space-y-6",
  cardPadding: "px-6 py-5",
} as const;
