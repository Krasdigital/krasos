import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../../src/features/auth/AuthProvider";
import { WorkspaceProvider } from "../../src/features/workspace/WorkspaceProvider";

export default function AppLayout() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <WorkspaceProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </WorkspaceProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f6f8",
  },
});
