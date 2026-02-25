/**
 * Background location service — only active when driver is on duty.
 *
 * Uses expo-location foreground tracking with a battery-conscious interval.
 * Background task registration requires additional native config that is
 * deferred to the EAS build phase.  For now, foreground-only with
 * 15-second updates while the app is visible.
 */

import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const ACCESS_KEY = "pop_access_token";
const UPDATE_INTERVAL_MS = 15_000;

let watchSubscription: Location.LocationSubscription | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function startLocationTracking(
  onPermissionDenied?: () => void,
): Promise<void> {
  const granted = await requestLocationPermission();
  if (!granted) {
    onPermissionDenied?.();
    return;
  }

  if (watchSubscription) return;

  watchSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: UPDATE_INTERVAL_MS,
      distanceInterval: 50,
    },
    async (location) => {
      try {
        const token = await AsyncStorage.getItem(ACCESS_KEY);
        if (!token) return;

        await fetch(`${API_BASE}/api/drivers/me/location`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          }),
        }).catch(() => {});
      } catch {}
    },
  );
}

export function stopLocationTracking(): void {
  if (watchSubscription) {
    watchSubscription.remove();
    watchSubscription = null;
  }
}
