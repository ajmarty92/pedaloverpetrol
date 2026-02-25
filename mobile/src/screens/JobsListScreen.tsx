import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useJobs, type Job } from "../api/jobs";
import { colors, fontSize, radius, spacing, STATUS_META } from "../theme/theme";
import type { AppStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<AppStackParamList, "JobsList">;

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: meta.color }]} />
      <Text style={[styles.badgeText, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <Text style={styles.trackingId}>{job.tracking_id}</Text>
        <StatusBadge status={job.status} />
      </View>

      <View style={styles.route}>
        <View style={styles.routeIndicator}>
          <View style={styles.dotPickup} />
          <View style={styles.routeLine} />
          <View style={styles.dotDropoff} />
        </View>
        <View style={styles.routeAddresses}>
          <Text style={styles.addressText} numberOfLines={1}>
            {job.pickup_address}
          </Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {job.dropoff_address}
          </Text>
        </View>
      </View>

      {job.notes ? (
        <Text style={styles.notes} numberOfLines={1}>
          {job.notes}
        </Text>
      ) : null}
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No jobs yet</Text>
      <Text style={styles.emptySubtitle}>
        Jobs assigned to you will appear here.
      </Text>
    </View>
  );
}

export default function JobsListScreen() {
  const navigation = useNavigation<Nav>();
  const { data: jobs, isLoading, isError, error, refetch } = useJobs();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Failed to load jobs</Text>
        <Text style={styles.errorDetail}>
          {error instanceof Error ? error.message : "Unknown error"}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <JobCard
          job={item}
          onPress={() => navigation.navigate("JobDetail", { jobId: item.id })}
        />
      )}
      ListEmptyComponent={EmptyState}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trackingId: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  route: {
    flexDirection: "row",
    gap: spacing.md,
  },
  routeIndicator: {
    width: 12,
    alignItems: "center",
    paddingVertical: 4,
  },
  dotPickup: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  dotDropoff: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  routeAddresses: {
    flex: 1,
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  notes: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  empty: {
    alignItems: "center",
    paddingTop: 120,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: "center",
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
