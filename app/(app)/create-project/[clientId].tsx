import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useWorkspace } from "../../../src/features/workspace/WorkspaceProvider";
import { supabase } from "../../../src/lib/supabase";

export default function CreateProjectScreen() {
  const params = useLocalSearchParams<{ clientId: string }>();
  const { organization, loading: workspaceLoading } = useWorkspace();

  const clientId = useMemo(() => {
    const rawClientId = params.clientId;
    return Array.isArray(rawClientId) ? rawClientId[0] : rawClientId;
  }, [params.clientId]);

  const [name, setName] = useState("");
  const [type, setType] = useState("Website");
  const [status, setStatus] = useState("planned");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function formatDateForDatabase(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(dateString: string) {
    if (!dateString) {
      return "";
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function dateFromString(dateString: string) {
    if (!dateString) {
      return new Date();
    }

    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function handleStartDateChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setShowStartPicker(false);
    }

    if (selectedDate) {
      setStartDate(formatDateForDatabase(selectedDate));
    }
  }

  function handleDueDateChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setShowDuePicker(false);
    }

    if (selectedDate) {
      setDueDate(formatDateForDatabase(selectedDate));
    }
  }

  async function handleCreateProject() {
    if (!organization?.id || !clientId) {
      Alert.alert("Missing workspace", "Organization or client was not loaded.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Missing project name", "Enter a project name first.");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("projects").insert({
        organization_id: organization.id,
        client_id: clientId,
        name: name.trim(),
        type: type.trim() || null,
        status: status.trim() || "planned",
        priority: priority.trim() || "medium",
        start_date: startDate.trim() || null,
        due_date: dueDate.trim() || null,
        description: description.trim() || null,
      });

      if (error) {
        throw error;
      }

      Alert.alert("Project created", "The project was added to Kras OS.", [
        {
          text: "View Projects",
          onPress: () => router.replace("/projects"),
        },
      ]);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create project.";

      Alert.alert("Project creation failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  if (workspaceLoading) {
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← Back to Client</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.eyebrow}>Project Layer</Text>
            <Text style={styles.title}>Create Project</Text>
            <Text style={styles.subtitle}>
              Add a real project under this client. This becomes the foundation
              for tasks, files, notes, timelines, and future billing.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Project Info</Text>

            <TextInput
              style={styles.input}
              placeholder="Project name"
              placeholderTextColor="#8a96a3"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Type: Website, SEO, CRM, Automation..."
              placeholderTextColor="#8a96a3"
              value={type}
              onChangeText={setType}
            />

            <View style={styles.twoColumnRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Status"
                placeholderTextColor="#8a96a3"
                value={status}
                onChangeText={setStatus}
                autoCapitalize="none"
              />

              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Priority"
                placeholderTextColor="#8a96a3"
                value={priority}
                onChangeText={setPriority}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text
                    style={[
                      styles.dateButtonText,
                      !startDate && styles.dateButtonPlaceholder,
                    ]}
                  >
                    {startDate ? formatDateForDisplay(startDate) : "Select date"}
                  </Text>
                </Pressable>

                {startDate ? (
                  <Pressable onPress={() => setStartDate("")}>
                    <Text style={styles.clearDateText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowDuePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateButtonText,
                      !dueDate && styles.dateButtonPlaceholder,
                    ]}
                  >
                    {dueDate ? formatDateForDisplay(dueDate) : "Select date"}
                  </Text>
                </Pressable>

                {dueDate ? (
                  <Pressable onPress={() => setDueDate("")}>
                    <Text style={styles.clearDateText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {showStartPicker ? (
              <DateTimePicker
                value={dateFromString(startDate)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleStartDateChange}
              />
            ) : null}

            {showDuePicker ? (
              <DateTimePicker
                value={dateFromString(dueDate)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDueDateChange}
              />
            ) : null}

            {Platform.OS === "ios" && (showStartPicker || showDuePicker) ? (
              <Pressable
                style={styles.doneDateButton}
                onPress={() => {
                  setShowStartPicker(false);
                  setShowDuePicker(false);
                }}
              >
                <Text style={styles.doneDateButtonText}>Done Selecting Date</Text>
              </Pressable>
            ) : null}

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Project description"
              placeholderTextColor="#8a96a3"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Pressable
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleCreateProject}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Creating..." : "Create Project"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  keyboardView: {
    flex: 1,
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
  header: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 22,
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
  dateField: {
    flex: 1,
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7b8794",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#d9e0e7",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#f9fafb",
  },
  dateButtonText: {
    fontSize: 15,
    color: "#16202a",
    fontWeight: "700",
  },
  dateButtonPlaceholder: {
    color: "#8a96a3",
    fontWeight: "500",
  },
  clearDateText: {
    color: "#52606d",
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 4,
  },
  doneDateButton: {
    backgroundColor: "#16202a",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  doneDateButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  descriptionInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#00bfff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },
});
