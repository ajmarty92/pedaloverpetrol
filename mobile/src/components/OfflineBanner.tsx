import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useOffline } from "../store/offline";
import { colors, fontSize, radius, spacing } from "../theme/theme";

export function OfflineBanner() {
  const { isOnline, pendingCount, isFlushing, flush } = useOffline();

  if (isOnline && pendingCount === 0) return null;

  const message = !isOnline
    ? `Offline — ${pendingCount} action${pendingCount !== 1 ? "s" : ""} pending sync`
    : isFlushing
      ? "Syncing queued actions…"
      : `${pendingCount} action${pendingCount !== 1 ? "s" : ""} waiting to sync`;

  const bg = !isOnline ? colors.warningBg : colors.infoBg;
  const fg = !isOnline ? colors.warning : colors.info;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{message}</Text>
      {isOnline && pendingCount > 0 && !isFlushing && (
        <Pressable onPress={flush} hitSlop={8}>
          <Text style={[styles.retry, { color: fg }]}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  retry: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
