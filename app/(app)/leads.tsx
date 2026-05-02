import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { supabase } from "../../src/lib/supabase";
import { useWorkspace } from "../../src/features/workspace/WorkspaceProvider";

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

export default function LeadsScreen() {
  const { organization, loading: workspaceLoading } = useWorkspace();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("MI");
  const [source, setSource] = useState("Manual");
  const [notes, setNotes] = useState("");

  const leadCount = leads.length;

  const newLeadCount = useMemo(
    () => leads.filter((lead) => lead.status === "new").length,
    [leads]
  );

  async function loadLeads() {
    if (!organization?.id) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setLeads(data ?? []);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load leads.";

      Alert.alert("Leads failed to load", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  }

  async function handleCreateLead() {
    if (!organization?.id) {
      Alert.alert("No workspace", "Your organization was not loaded yet.");
      return;
    }

    if (!companyName.trim()) {
      Alert.alert("Missing company", "Enter a company name first.");
      return;
    }

    try {
      const { error } = await supabase.from("leads").insert({
        organization_id: organization.id,
        company_name: companyName.trim(),
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim().toLowerCase() || null,
        website: website.trim() || null,
        industry: industry.trim() || null,
        city: city.trim() || null,
        state: stateValue.trim() || null,
        source: source.trim() || null,
        status: "new",
        notes: notes.trim() || null,
      });

      if (error) {
        throw error;
      }

      setCompanyName("");
      setContactName("");
      setPhone("");
      setEmail("");
      setWebsite("");
      setIndustry("");
      setCity("");
      setStateValue("MI");
      setSource("Manual");
      setNotes("");

      await loadLeads();

      Alert.alert("Lead created", "The lead was added to your CRM.");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create lead.";

      Alert.alert("Lead creation failed", message);
    }
  }

  useEffect(() => {
    if (!workspaceLoading) {
      loadLeads();
    }
  }, [workspaceLoading, organization?.id]);

  if (workspaceLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading leads...</Text>
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

          <Text style={styles.eyebrow}>CRM Foundation</Text>
          <Text style={styles.title}>Leads</Text>
          <Text style={styles.subtitle}>
            Capture contractor prospects, track outreach, and start building the
            Golden Index pipeline inside Kras OS.
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Leads</Text>
            <Text style={styles.metricValue}>{leadCount}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>New Leads</Text>
            <Text style={styles.metricValue}>{newLeadCount}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add Lead</Text>

          <TextInput
            style={styles.input}
            placeholder="Company name"
            placeholderTextColor="#8a96a3"
            value={companyName}
            onChangeText={setCompanyName}
          />

          <TextInput
            style={styles.input}
            placeholder="Contact name"
            placeholderTextColor="#8a96a3"
            value={contactName}
            onChangeText={setContactName}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor="#8a96a3"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8a96a3"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Website"
            placeholderTextColor="#8a96a3"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
          />

          <View style={styles.twoColumnRow}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Industry"
              placeholderTextColor="#8a96a3"
              value={industry}
              onChangeText={setIndustry}
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Source"
              placeholderTextColor="#8a96a3"
              value={source}
              onChangeText={setSource}
            />
          </View>

          <View style={styles.twoColumnRow}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City"
              placeholderTextColor="#8a96a3"
              value={city}
              onChangeText={setCity}
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State"
              placeholderTextColor="#8a96a3"
              value={stateValue}
              onChangeText={setStateValue}
              autoCapitalize="characters"
            />
          </View>

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes"
            placeholderTextColor="#8a96a3"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Pressable style={styles.primaryButton} onPress={handleCreateLead}>
            <Text style={styles.primaryButtonText}>Create Lead</Text>
          </Pressable>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Lead Pipeline</Text>

          {leads.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No leads yet</Text>
              <Text style={styles.emptyText}>
                Add your first contractor lead to test the CRM flow.
              </Text>
            </View>
          ) : (
            leads.map((lead) => (
              <View key={lead.id} style={styles.leadCard}>
                <View style={styles.leadTopRow}>
                  <View style={styles.leadMainInfo}>
                    <Text style={styles.leadCompany}>{lead.company_name}</Text>
                    <Text style={styles.leadMeta}>
                      {[lead.industry, lead.city, lead.state]
                        .filter(Boolean)
                        .join(" • ") || "No details yet"}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{lead.status}</Text>
                  </View>
                </View>

                {lead.contact_name ? (
                  <Text style={styles.leadLine}>
                    Contact: {lead.contact_name}
                  </Text>
                ) : null}

                {lead.phone ? (
                  <Text style={styles.leadLine}>Phone: {lead.phone}</Text>
                ) : null}

                {lead.email ? (
                  <Text style={styles.leadLine}>Email: {lead.email}</Text>
                ) : null}

                {lead.website ? (
                  <Text style={styles.leadLine}>Website: {lead.website}</Text>
                ) : null}

                {lead.notes ? (
                  <Text style={styles.leadNotes}>{lead.notes}</Text>
                ) : null}
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
    fontWeight: "800",
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
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
    fontWeight: "800",
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
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#d9e0e7",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#16202a",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9e0e7",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#16202a",
    backgroundColor: "#f9fafb",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#16202a",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },
  listSection: {
    gap: 12,
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
  leadCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d9e0e7",
    gap: 8,
  },
  leadTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  leadMainInfo: {
    flex: 1,
  },
  leadCompany: {
    fontSize: 19,
    fontWeight: "900",
    color: "#16202a",
  },
  leadMeta: {
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
  leadLine: {
    color: "#52606d",
    fontWeight: "600",
  },
  leadNotes: {
    color: "#16202a",
    lineHeight: 20,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#edf1f5",
  },
});
