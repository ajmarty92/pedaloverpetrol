import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../api/client";
import { useOffline } from "../store/offline";
import { colors, fontSize, radius, spacing } from "../theme/theme";
import type { AppStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "PODCapture">;

const MAX_PHOTOS = 3;

export default function PODScreen({ route, navigation }: Props) {
  const { jobId, trackingId } = route.params;
  const queryClient = useQueryClient();
  const { isOnline, enqueue } = useOffline();

  const [recipientName, setRecipientName] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = recipientName.trim().length > 0 && !submitting;

  async function pickPhoto() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  }

  function removePhoto(idx: number) {
    setPhotoUris((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);

    const podPayload = {
      recipient_name: recipientName.trim(),
      photo_urls: photoUris.length > 0 ? photoUris : null,
      signature_url: null,
    };

    try {
      if (isOnline) {
        await api.post(`/api/jobs/${jobId}/pod`, podPayload);
        await api.patch(`/api/jobs/${jobId}`, { status: "delivered" });
      } else {
        await enqueue({ type: "pod_submit", jobId, payload: podPayload });
        await enqueue({ type: "status_update", jobId, payload: { status: "delivered" } });
      }

      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });

      Alert.alert(
        "POD Submitted",
        isOnline
          ? "Proof of delivery has been recorded."
          : "Saved offline — will sync when connected.",
        [{ text: "OK", onPress: () => navigation.popToTop() }],
      );
    } catch (err: any) {
      if (err instanceof ApiError && err.status >= 400) {
        Alert.alert("Error", err.message);
      } else {
        await enqueue({ type: "pod_submit", jobId, payload: podPayload });
        await enqueue({ type: "status_update", jobId, payload: { status: "delivered" } });
        Alert.alert(
          "Saved Offline",
          "Network issue — POD queued for sync.",
          [{ text: "OK", onPress: () => navigation.popToTop() }],
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Proof of Delivery</Text>
          <Text style={styles.headerSub}>{trackingId}</Text>
        </View>

        {/* Recipient name */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recipient</Text>
          <TextInput
            style={styles.input}
            placeholder="Name of person receiving the package"
            placeholderTextColor={colors.textMuted}
            value={recipientName}
            onChangeText={setRecipientName}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Signature placeholder */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Signature</Text>
          <View style={styles.signaturePlaceholder}>
            <Text style={styles.signaturePlaceholderText}>
              Signature capture will be available in the next build.{"\n"}
              Tap the area where the customer would sign.
            </Text>
          </View>
        </View>

        {/* Photos */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Photos ({photoUris.length}/{MAX_PHOTOS})
          </Text>
          <View style={styles.photoGrid}>
            {photoUris.map((uri, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <Pressable
                  style={styles.photoRemove}
                  onPress={() => removePhoto(i)}
                >
                  <Text style={styles.photoRemoveText}>✕</Text>
                </Pressable>
              </View>
            ))}
            {photoUris.length < MAX_PHOTOS && (
              <Pressable
                style={({ pressed }) => [
                  styles.addPhotoBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={pickPhoto}
              >
                <Text style={styles.addPhotoIcon}>📷</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Offline banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              You're offline — POD will be queued and synced automatically.
            </Text>
          </View>
        )}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && { opacity: 0.85 },
            !canSubmit && styles.submitDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitText}>Submit POD & Mark Delivered</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl + 40,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.text,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
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
  },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text,
  },
  signaturePlaceholder: {
    height: 120,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  signaturePlaceholderText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  photoWrapper: { position: "relative" },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  photoRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  photoRemoveText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  addPhotoBtn: {
    width: 90,
    height: 90,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoIcon: { fontSize: 24 },
  addPhotoText: { fontSize: fontSize.xs, color: colors.textMuted },
  offlineBanner: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  offlineBannerText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    textAlign: "center",
  },
  submitButton: {
    height: 54,
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
