export const colors = {
  primary: "#FF7A00",
  primaryLight: "#FF9E40",
  primaryDark: "#E06C00",

  background: "#000000",
  surface: "#111111",
  card: "#1A1A1A",
  cardElevated: "#222222",

  text: "#FFFFFF",
  textSecondary: "#999999",
  textMuted: "#666666",
  textOnPrimary: "#FFFFFF",

  border: "#333333",
  separator: "#222222",

  success: "#22C55E",
  successBg: "#052E16",
  danger: "#EF4444",
  dangerBg: "#450A0A",
  warning: "#F59E0B",
  warningBg: "#451A03",
  info: "#3B82F6",
  infoBg: "#172554",

  statusPending: "#666666",
  statusAssigned: "#FF7A00",
  statusPickedUp: "#3B82F6",
  statusInTransit: "#F59E0B",
  statusDelivered: "#22C55E",
  statusFailed: "#EF4444",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 34,
} as const;

export const navigationTheme = {
  dark: true as const,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" as const },
    medium: { fontFamily: "System", fontWeight: "500" as const },
    bold: { fontFamily: "System", fontWeight: "700" as const },
    heavy: { fontFamily: "System", fontWeight: "800" as const },
  },
};

export const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: colors.statusPending, bg: "#1A1A1A" },
  assigned: { label: "Assigned", color: colors.statusAssigned, bg: "#2A1800" },
  picked_up: { label: "Picked Up", color: colors.statusPickedUp, bg: "#0A1A3A" },
  in_transit: { label: "In Transit", color: colors.statusInTransit, bg: "#2A1A00" },
  delivered: { label: "Delivered", color: colors.statusDelivered, bg: colors.successBg },
  failed: { label: "Failed", color: colors.statusFailed, bg: colors.dangerBg },
};
