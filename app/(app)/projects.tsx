import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useWorkspace } from "../../src/features/workspace/WorkspaceProvider";
import { supabase } from "../../src/lib/supabase";

type Project = {
  id: string;
  organization_id: string;
  client_id: string | null;
  name: string;
  type: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export default function ProjectsScreen() {
  const { organization, loading: workspaceLoading } = useWorkspace();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeProjectCount = useMemo(
    () =>
      projects.filter((project) =>
        ["planned", "active", "in_progress"].includes(project.status)
      ).length,
    [projects]
  );

  async function loadProjects() {
    if (!organization?.id) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setProjects(data ?? []);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load projects.";

      Alert.alert("Projects failed to load", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }

  useEffect(() => {
    if (!workspaceLoading) {
      loadProjects();
    }
  }, [workspaceLoading, organization?.id]);

  if (workspaceLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Dashboard</Text>
          </Pressable>

          <Text style={styles.eyebrow}>Execution Layer</Text>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.subtitle}>
            Projects connect clients to real work. This is where websites, SEO
            campaigns, automations, dashboards, and future tasks will live.
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Projects</Text>
            <Text style={styles.metricValue}>{projects.length}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active</Text>
            <Text style={styles.metricValue}>{activeProjectCount}</Text>
          </View>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Project List</Text>

          {projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyText}>
                Open a client account and create your first project from there.
              </Text>
            </View>
          ) : (
            projects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectTopRow}>
                  <View style={styles.projectMainInfo}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectMeta}>
                      {[project.type, project.priority].filter(Boolean).join(" • ")}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{project.status}</Text>
                  </View>
                </View>

                {project.description ? (
                  <Text style={styles.projectDescription}>
                    {project.description}
                  </Text>
                ) : null}

                <View style={styles.dateRow}>
                  <Text style={styles.dateText}>
                    Start: {project.start_date || "Not set"}
                  </Text>
                  <Text style={styles.dateText}>
                    Due: {project.due_date || "Not set"}
                  </Text>
                </View>
              </View>
            ))
          )}
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
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  backText: {
    color: "#52606d",
    fontWeight: "900",
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#7b8794",
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#16202a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#52606d",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7b8794",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 30,
    fontWeight: "900",
    color: "#16202a",
  },
  listSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#16202a",
    marginBottom: 4,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#16202a",
    marginBottom: 6,
  },
  emptyText: {
    color: "#52606d",
    lineHeight: 20,
  },
  projectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d9e0e7",
    gap: 8,
  },
  projectTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  projectMainInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 19,
    fontWeight: "900",
    color: "#16202a",
  },
  projectMeta: {
    color: "#52606d",
    marginTop: 4,
    lineHeight: 19,
  },
  statusBadge: {
    backgroundColor: "#eef2f6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: "#52606d",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  projectDescription: {
    color: "#52606d",
    lineHeight: 20,
  },
  dateRow: {
    marginTop: 6,
    gap: 4,
  },
  dateText: {
    color: "#52606d",
    fontWeight: "700",
  },
});
