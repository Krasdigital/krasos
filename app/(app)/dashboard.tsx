import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KRAS_MODULES } from "../../src/constants/modules";
import { useAuth } from "../../src/features/auth/AuthProvider";

export default function DashboardScreen() {
  const { signOut, user } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign out.";
      Alert.alert("Sign out failed", message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.eyebrow}>Kras OS</Text>
          <Text style={styles.title}>Business Dashboard</Text>
          <Text style={styles.subtitle}>
            The foundational workspace for Kras Digital operations, organized
            around the 12 core software modules.
          </Text>

          <View style={styles.sessionBox}>
            <Text style={styles.sessionLabel}>Signed in as</Text>
            <Text style={styles.sessionEmail}>{user?.email}</Text>
          </View>

          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={styles.modulesSection}>
          {KRAS_MODULES.map((module, index) => (
            <View key={module.name} style={styles.moduleCard}>
              <Text style={styles.moduleIndex}>
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text style={styles.moduleName}>{module.name}</Text>
              <Text style={styles.moduleDescription}>
                {module.description}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  heroSection: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#5f6b76",
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#16202a",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#52606d",
  },
  sessionBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f4f6f8",
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7b8794",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sessionEmail: {
    fontSize: 14,
    color: "#16202a",
    fontWeight: "600",
  },
  signOutButton: {
    marginTop: 14,
    backgroundColor: "#16202a",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  modulesSection: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d9e0e7",
    gap: 6,
  },
  moduleIndex: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#7b8794",
  },
  moduleName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#16202a",
  },
  moduleDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#52606d",
  },
});
