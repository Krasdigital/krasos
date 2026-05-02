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

type Client = {
  id: string;
  organization_id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  status: string;
  monthly_value: number | null;
  one_time_value: number | null;
  notes: string | null;
  source_lead_id?: string | null;
  converted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export default function ClientsScreen() {
  const { organization, loading: workspaceLoading } = useWorkspace();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeClientCount = useMemo(
    () => clients.filter((client) => client.status === "active").length,
    [clients]
  );

  const monthlyRevenue = useMemo(
    () =>
      clients.reduce(
        (total, client) => total + Number(client.monthly_value ?? 0),
        0
      ),
    [clients]
  );

  async function loadClients() {
    if (!organization?.id) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setClients(data ?? []);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load clients.";

      Alert.alert("Clients failed to load", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }

  useEffect(() => {
    if (!workspaceLoading) {
      loadClients();
    }
  }, [workspaceLoading, organization?.id]);

  if (workspaceLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading clients...</Text>
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

          <Text style={styles.eyebrow}>Revenue Foundation</Text>
          <Text style={styles.title}>Clients</Text>
          <Text style={styles.subtitle}>
            Your active customer base. Leads that become won deals will land
            here and eventually connect to projects, tasks, files, and billing.
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Clients</Text>
            <Text style={styles.metricValue}>{clients.length}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active</Text>
            <Text style={styles.metricValue}>{activeClientCount}</Text>
          </View>
        </View>

        <View style={styles.metricWideCard}>
          <Text style={styles.metricLabel}>Monthly Value</Text>
          <Text style={styles.metricValue}>${monthlyRevenue.toFixed(2)}</Text>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Client List</Text>

          {clients.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No clients yet</Text>
              <Text style={styles.emptyText}>
                Convert a won lead into a client to start building the client
                layer of Kras OS.
              </Text>
            </View>
          ) : (
            clients.map((client) => (
              <Pressable
                key={client.id}
                style={styles.clientCard}
                onPress={() => router.push(`/client-detail/${client.id}`)}
              >
                <View style={styles.clientTopRow}>
                  <View style={styles.clientMainInfo}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <Text style={styles.clientMeta}>
                      {[client.industry, client.status]
                        .filter(Boolean)
                        .join(" • ")}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{client.status}</Text>
                  </View>
                </View>

                {client.contact_name ? (
                  <Text style={styles.clientLine}>
                    Contact: {client.contact_name}
                  </Text>
                ) : null}

                {client.phone ? (
                  <Text style={styles.clientLine}>Phone: {client.phone}</Text>
                ) : null}

                {client.email ? (
                  <Text style={styles.clientLine}>Email: {client.email}</Text>
                ) : null}

                {client.website ? (
                  <Text style={styles.clientLine}>
                    Website: {client.website}
                  </Text>
                ) : null}

                {client.source_lead_id ? (
                  <Text style={styles.convertedText}>
                    Converted from lead pipeline
                  </Text>
                ) : null}

                <Text style={styles.openText}>Tap to manage client →</Text>
              </Pressable>
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
  metricWideCard: {
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
  clientCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d9e0e7",
    gap: 8,
  },
  clientTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  clientMainInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 19,
    fontWeight: "900",
    color: "#16202a",
  },
  clientMeta: {
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
  clientLine: {
    color: "#52606d",
    fontWeight: "600",
  },
  convertedText: {
    marginTop: 6,
    color: "#0284c7",
    fontWeight: "900",
  },
  openText: {
    marginTop: 8,
    color: "#16202a",
    fontWeight: "900",
  },
});
