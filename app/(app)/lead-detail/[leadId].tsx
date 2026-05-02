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

const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;

type LeadStatus = (typeof LEAD_STATUSES)[number];

type Lead = {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  status: string;
  digital_health_score: number | null;
  opportunity_score: number | null;
  notes: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function LeadDetailScreen() {
  const params = useLocalSearchParams<{ leadId: string }>();
  const { organization, loading: workspaceLoading } = useWorkspace();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const leadId = useMemo(() => {
    const rawLeadId = params.leadId;
    return Array.isArray(rawLeadId) ? rawLeadId[0] : rawLeadId;
  }, [params.leadId]);

  async function loadLead() {
    if (!organization?.id || !leadId) {
      setLead(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .eq("organization_id", organization.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setLead(data);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to load lead.";

      Alert.alert("Lead failed to load", message);
    } finally {
      setLoading(false);
    }
  }

  async function updateLeadStatus(status: LeadStatus) {
    if (!organization?.id || !lead?.id) {
      return;
    }

    try {
      setUpdatingStatus(status);

      const { error } = await supabase
        .from("leads")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id)
        .eq("organization_id", organization.id);

      if (error) {
        throw error;
      }

      setLead((currentLead) =>
        currentLead ? { ...currentLead, status } : currentLead
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update status.";

      Alert.alert("Status update failed", message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function deleteLead() {
    if (!organization?.id || !lead?.id) {
      return;
    }

    Alert.alert(
      "Delete lead?",
      "This will remove the lead from your CRM. This cannot be undone.",
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
                .from("leads")
                .delete()
                .eq("id", lead.id)
                .eq("organization_id", organization.id);

              if (error) {
                throw error;
              }

              router.replace("/leads");
            } catch (caughtError) {
              const message =
                caughtError instanceof Error
                  ? caughtError.message
                  : "Unable to delete lead.";

              Alert.alert("Delete failed", message);
            }
          },
        },
      ]
    );
  }

  useEffect(() => {
    if (!workspaceLoading) {
      loadLead();
    }
  }, [workspaceLoading, organization?.id, leadId]);

  if (workspaceLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading lead...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lead) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Pressable onPress={() => router.replace("/leads")}>
            <Text style={styles.backText}>← Back to Leads</Text>
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.title}>Lead Not Found</Text>
            <Text style={styles.subtitle}>
              This lead may have been deleted or you may not have access to it.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.replace("/leads")}>
          <Text style={styles.backText}>← Back to Leads</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Lead Detail</Text>
          <Text style={styles.title}>{lead.company_name}</Text>
          <Text style={styles.subtitle}>
            Manage lead status, review contact details, and prepare the prospect
            for future client conversion.
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{lead.status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pipeline Status</Text>

          <View style={styles.statusGrid}>
            {LEAD_STATUSES.map((status) => {
              const isActive = lead.status === status;
              const isUpdating = updatingStatus === status;

              return (
                <Pressable
                  key={status}
                  style={[styles.statusButton, isActive && styles.statusButtonActive]}
                  onPress={() => updateLeadStatus(status)}
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

          <InfoRow label="Contact" value={lead.contact_name} />
          <InfoRow label="Phone" value={lead.phone} />
          <InfoRow label="Email" value={lead.email} />
          <InfoRow label="Website" value={lead.website} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lead Details</Text>

          <InfoRow label="Industry" value={lead.industry} />
          <InfoRow
            label="Location"
            value={[lead.city, lead.state].filter(Boolean).join(", ")}
          />
          <InfoRow label="Source" value={lead.source} />
          <InfoRow
            label="Digital Health Score"
            value={
              lead.digital_health_score === null
                ? null
                : String(lead.digital_health_score)
            }
          />
          <InfoRow
            label="Opportunity Score"
            value={
              lead.opportunity_score === null
                ? null
                : String(lead.opportunity_score)
            }
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>
            {lead.notes || "No notes have been added yet."}
          </Text>
        </View>

        <Pressable style={styles.deleteButton} onPress={deleteLead}>
          <Text style={styles.deleteButtonText}>Delete Lead</Text>
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
