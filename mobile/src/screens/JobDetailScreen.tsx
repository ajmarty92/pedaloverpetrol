import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useJob, useUpdateJobStatus, type JobStatus } from "../api/jobs";
import {
  colors,
  fontSize,
  radius,
  spacing,
  STATUS_META,
} from "../theme/theme";
import type { AppStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "JobDetail">;

interface StatusAction {
  label: string;
  target: JobStatus;
  variant: "primary" | "success" | "danger";
}

const NEXT_ACTIONS: Partial<Record<JobStatus, StatusAction[]>> = {
  assigned: [
    { label: "Mark Picked Up", target: "picked_up", variant: "primary" },
  ],
  picked_up: [
    { label: "Mark In Transit", target: "in_transit", variant: "primary" },
  ],
  in_transit: [
    { label: "Mark Delivered", target: "delivered", variant: "success" },
    { label: "Mark Failed", target: "failed", variant: "danger" },
  ],
};

const VARIANT_COLORS: Record<string, { bg: string; text: string }> = {
  primary: { bg: colors.primary, text: colors.textOnPrimary },
  success: { bg: colors.success, text: "#FFFFFF" },
  danger: { bg: colors.danger, text: "#FFFFFF" },
};

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function StatusBadgeLarge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <View style={[styles.badgeLarge, { backgroundColor: meta.bg }]}>
      <View style={[styles.badgeLargeDot, { backgroundColor: meta.color }]} />
      <Text style={[styles.badgeLargeText, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

export default function JobDetailScreen({ route }: Props) {
  const { jobId } = route.params;
  const { data: job, isLoading, isError, refetch } = useJob(jobId);
  const mutation = useUpdateJobStatus();
  const [failReason, setFailReason] = useState("");
  const [showFailInput, setShowFailInput] = useState(false);

  function handleAction(action: StatusAction) {
    if (action.target === "failed") {
      setShowFailInput(true);
      return;
    }
    confirmAndUpdate(action.target);
  }

  function confirmAndUpdate(target: JobStatus) {
    Alert.alert(
      "Confirm Status Update",
      `Change status to "${STATUS_META[target]?.label ?? target}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () =>
            mutation.mutate(
              { jobId, status: target },
              {
                onSuccess: () => {
                  setShowFailInput(false);
                  setFailReason("");
                },
                onError: (err) => {
                  Alert.alert("Error", err.message);
                },
              }
            ),
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !job) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load job details.</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const actions = NEXT_ACTIONS[job.status] ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header card */}
      <View style={styles.headerCard}>
        <Text style={styles.trackingId}>{job.tracking_id}</Text>
        <StatusBadgeLarge status={job.status} />
      </View>

      {/* Route card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Route</Text>
        <View style={styles.routeRow}>
          <View style={styles.routeIndicator}>
            <View style={styles.dotPickup} />
            <View style={styles.routeLineVert} />
            <View style={styles.dotDropoff} />
          </View>
          <View style={styles.routeAddresses}>
            <View>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddress}>{job.pickup_address}</Text>
            </View>
            <View>
              <Text style={styles.routeLabel}>Drop-off</Text>
              <Text style={styles.routeAddress}>{job.dropoff_address}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Details card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <InfoRow label="Customer" value={job.customer_id.slice(0, 8) + "…"} />
        <InfoRow
          label="Price"
          value={job.price != null ? `$${job.price.toFixed(2)}` : null}
        />
        <InfoRow label="Notes" value={job.notes} />
        <InfoRow
          label="Created"
          value={new Date(job.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
      </View>

      {/* Action buttons */}
      {actions.length > 0 && (
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>
          {actions.map((action) => {
            const vc = VARIANT_COLORS[action.variant];
            return (
              <Pressable
                key={action.target}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: vc.bg },
                  pressed && { opacity: 0.85 },
                  mutation.isPending && { opacity: 0.6 },
                ]}
                onPress={() => handleAction(action)}
                disabled={mutation.isPending}
              >
                {mutation.isPending &&
                mutation.variables?.status === action.target ? (
                  <ActivityIndicator color={vc.text} size="small" />
                ) : (
                  <Text style={[styles.actionButtonText, { color: vc.text }]}>
                    {action.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Fail reason input */}
      {showFailInput && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Failure Reason</Text>
          <TextInput
            style={styles.failInput}
            placeholder="Describe why the delivery failed…"
            placeholderTextColor={colors.textMuted}
            value={failReason}
            onChangeText={setFailReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <View style={styles.failActions}>
            <Pressable
              style={styles.failCancel}
              onPress={() => {
                setShowFailInput(false);
                setFailReason("");
              }}
            >
              <Text style={styles.failCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: colors.danger, flex: 1 },
              ]}
              onPress={() => confirmAndUpdate("failed")}
            >
              <Text style={styles.actionButtonText}>Confirm Failed</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl + 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trackingId: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  badgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  badgeLargeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeLargeText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  routeRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  routeIndicator: {
    width: 14,
    alignItems: "center",
    paddingVertical: 4,
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  routeLineVert: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  dotDropoff: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  routeAddresses: {
    flex: 1,
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  routeLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  actionsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    height: 50,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  failInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 80,
  },
  failActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  failCancel: {
    height: 50,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  failCancelText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
  },
  retryText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.primary,
  },
});
