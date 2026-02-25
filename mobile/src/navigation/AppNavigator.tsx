import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../store/auth";
import { OfflineBanner } from "../components/OfflineBanner";
import { colors, fontSize, spacing } from "../theme/theme";
import JobsListScreen from "../screens/JobsListScreen";
import JobDetailScreen from "../screens/JobDetailScreen";
import PODScreen from "../screens/PODScreen";

export type AppStackParamList = {
  JobsList: undefined;
  JobDetail: { jobId: string };
  PODCapture: { jobId: string; trackingId: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable onPress={signOut} hitSlop={8}>
      <Text style={styles.logout}>Logout</Text>
    </Pressable>
  );
}

export default function AppNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "600", fontSize: fontSize.lg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="JobsList"
          component={JobsListScreen}
          options={{
            title: "My Jobs",
            headerRight: () => <LogoutButton />,
          }}
        />
        <Stack.Screen
          name="JobDetail"
          component={JobDetailScreen}
          options={{ title: "Job Details" }}
        />
        <Stack.Screen
          name="PODCapture"
          component={PODScreen}
          options={{ title: "Proof of Delivery" }}
        />
      </Stack.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  logout: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
    paddingHorizontal: spacing.sm,
  },
});
