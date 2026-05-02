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
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Start date YYYY-MM-DD"
                placeholderTextColor="#8a96a3"
                value={startDate}
                onChangeText={setStartDate}
              />

              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Due date YYYY-MM-DD"
                placeholderTextColor="#8a96a3"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

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
