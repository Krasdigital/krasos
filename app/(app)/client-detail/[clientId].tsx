import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import { useWorkspace } from "../../../src/features/workspace/WorkspaceProvider";
import { supabase } from "../../../src/lib/supabase";

const CLIENT_STATUSES = ["active", "paused", "completed", "lost"] as const;

type ClientStatus = (typeof CLIENT_STATUSES)[number];

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

export default function ClientDetailScreen() {
  const params = useLocalSearchParams<{ clientId: string }>();
  const { organization, loading: workspaceLoading } = useWorkspace();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const clientId = useMemo(() => {
    const rawClientId = params.clientId;
    return Array.isArray(rawClientId) ? rawClientId[0] : rawClientId;
  }, [params.clientId]);

  async function loadClient() {
    if (!organization?.id || !clientId) {
      setClient(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .eq("organization_id", organization.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setClient(data);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load client.";

      Alert.alert("Client failed to load", message);
    } finally {
      setLoading(false);
    }
  }

  async function updateClientStatus(status: ClientStatus) {
    if (!organization?.id || !client?.id) {
      return;
    }

    try {
      setUpdatingStatus(status);

      const { error } = await supabase
        .from("clients")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", client.id)
        .eq("organization_id", organization.id);

      if (error) {
        throw error;
      }

      setClient((currentClient) =>
        currentClient ? { ...currentClient, status } : currentClient
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update client status.";

      Alert.alert("Status update failed", message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function deleteClient() {
    if (!organization?.id || !client?.id) {
      return;
    }

    Alert.alert(
      "Delete client?",
      "This will remove the client account from Kras OS. This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("clients")
                .delete()
                .eq("id", client.id)
                .eq("organization_id", organization.id);

              if (error) {
                throw error;
              }

              router.replace("/clients");
            } catch (caughtError) {
              const message =
                caughtError instanceof Error
                  ? caughtError.message
                  : "Unable to delete client.";

              Alert.alert("Delete failed", message);
            }
          },
        },
      ]
    );
  }

  useEffect(() => {
    if (!workspaceLoading) {
      loadClient();
    }
  }, [workspaceLoading, organization?.id, clientId]);

  if (workspaceLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading client...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Pressable onPress={() => router.replace("/clients")}>
            <Text style={styles.backText}>← Back to Clients</Text>
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.title}>Client Not Found</Text>
            <Text style={styles.subtitle}>
              This client may have been deleted or you may not have access.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const totalValue =
    Number(client.monthly_value ?? 0) + Number(client.one_time_value ?? 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace("/clients")}>
          <Text style={styles.backText}>← Back to Clients</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Client Account</Text>
          <Text style={styles.title}>{client.name}</Text>
          <Text style={styles.subtitle}>
            Manage the client relationship, revenue value, account status, and
            future project work inside Kras OS.
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{client.status}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Monthly</Text>
            <Text style={styles.metricValue}>
              ${Number(client.monthly_value ?? 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>One-Time</Text>
            <Text style={styles.metricValue}>
              ${Number(client.one_time_value ?? 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Status</Text>

          <View style={styles.statusGrid}>
            {CLIENT_STATUSES.map((status) => {
              const isActive = client.status === status;
              const isUpdating = updatingStatus === status;

              return (
                <Pressable
                  key={status}
                  style={[
                    styles.statusButton,
                    isActive && styles.statusButtonActive,
                  ]}
                  onPress={() => updateClientStatus(status)}
                  disabled={!!updatingStatus}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      isActive && styles.statusButtonTextActive,
                    ]}
                  >
                    {isUpdating ? "Updating..." : status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Info</Text>

          <InfoRow label="Contact" value={client.contact_name} />
          <InfoRow label="Phone" value={client.phone} />
          <InfoRow label="Email" value={client.email} />
          <InfoRow label="Website" value={client.website} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Client Details</Text>

          <InfoRow label="Industry" value={client.industry} />
          <InfoRow label="Status" value={client.status} />
          <InfoRow
            label="Total Recorded Value"
            value={`$${totalValue.toFixed(2)}`}
          />
          <InfoRow
            label="Converted From Lead"
            value={client.source_lead_id ? "Yes" : "No"}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Future Client Tools</Text>

          <View style={styles.futureBox}>
            <Text style={styles.futureTitle}>Projects</Text>
            <Text style={styles.futureText}>
              Next, this client will connect to projects, tasks, files, notes,
              billing, and AI follow-ups.
            </Text>
          </View>

          <Pressable
            style={styles.disabledButton}
            onPress={() =>
              Alert.alert(
                "Coming next",
                "Project creation will be added after the client detail foundation is committed."
              )
            }
          >
            <Text style={styles.disabledButtonText}>Create Project Soon</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>
            {client.notes || "No notes have been added yet."}
          </Text>
        </View>

        <Pressable style={styles.deleteButton} onPress={deleteClient}>
          <Text style={styles.deleteButtonText}>Delete Client</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Not added"}</Text>
    </View>
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
    gap: 16,
  },
  backText: {
    color: "#52606d",
    fontWeight: "900",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#d9e0e7",
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
    fontSize: 32,
    fontWeight: "900",
    color: "#16202a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#52606d",
  },
  statusPill: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: "#eef2f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusPillText: {
    color: "#16202a",
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
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
    fontSize: 22,
    fontWeight: "900",
    color: "#16202a",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#16202a",
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusButton: {
    backgroundColor: "#f4f6f8",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  statusButtonActive: {
    backgroundColor: "#00bfff",
    borderColor: "#00bfff",
  },
  statusButtonText: {
    color: "#52606d",
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
  },
  statusButtonTextActive: {
    color: "#ffffff",
  },
  infoRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#edf1f5",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7b8794",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  infoValue: {
    color: "#16202a",
    fontWeight: "700",
    lineHeight: 20,
  },
  futureBox: {
    backgroundColor: "#f4f6f8",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#d9e0e7",
    marginBottom: 12,
  },
  futureTitle: {
    color: "#16202a",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
  },
  futureText: {
    color: "#52606d",
    lineHeight: 20,
  },
  disabledButton: {
    backgroundColor: "#e5eaf0",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabledButtonText: {
    color: "#52606d",
    fontWeight: "900",
  },
  notesText: {
    color: "#52606d",
    lineHeight: 21,
  },
  deleteButton: {
    backgroundColor: "#991b1b",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
});
