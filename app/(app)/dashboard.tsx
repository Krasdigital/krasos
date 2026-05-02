import { router } from "expo-router";
import {
  ActivityIndicator,
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
import { useWorkspace } from "../../src/features/workspace/WorkspaceProvider";

export default function DashboardScreen() {
  const { signOut, user } = useAuth();
  const { loading, error, profile, organization, membership, role } =
    useWorkspace();

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/login");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to sign out.";
      Alert.alert("Sign out failed", message);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.eyebrow}>Kras OS</Text>
          <Text style={styles.title}>
            {organization?.name ?? "Business Dashboard"}
          </Text>
          <Text style={styles.subtitle}>
            Your secure command center for Kras Digital operations, projects,
            clients, tasks, files, and future automation.
          </Text>

          {error ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Workspace issue</Text>
              <Text style={styles.warningText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.sessionGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Signed in as</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Profile</Text>
              <Text style={styles.infoValue}>
                {profile?.full_name ?? "No profile name"}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {role ? role.toUpperCase() : "No role found"}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Workspace ID</Text>
              <Text style={styles.infoValueSmall}>
                {membership?.organization_id ?? "No organization linked"}
              </Text>
            </View>
          </View>

          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Kras Software Standard</Text>

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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#52606d",
    fontWeight: "600",
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
    fontWeight: "800",
    color: "#16202a",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#52606d",
  },
  warningBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#9a3412",
    marginBottom: 4,
  },
  warningText: {
    color: "#9a3412",
    lineHeight: 20,
  },
  sessionGrid: {
    marginTop: 18,
    gap: 10,
  },
  infoBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f4f6f8",
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7b8794",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 14,
    color: "#16202a",
    fontWeight: "700",
  },
  infoValueSmall: {
    fontSize: 12,
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
    fontWeight: "800",
  },
  modulesSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#16202a",
    marginBottom: 4,
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
    fontWeight: "700",
    color: "#16202a",
  },
  moduleDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#52606d",
  },
});
