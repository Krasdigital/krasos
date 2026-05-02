import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useWorkspace } from "../../../src/features/workspace/WorkspaceProvider";
import { supabase } from "../../../src/lib/supabase";

const PROJECT_STATUSES = [
  "planned",
  "active",
  "in_progress",
  "review",
  "completed",
  "paused",
] as const;

const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

type ProjectStatus = (typeof PROJECT_STATUSES)[number];
type TaskStatus = (typeof TASK_STATUSES)[number];

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

type Task = {
  id: string;
  organization_id: string;
  project_id: string | null;
  client_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function ProjectDetailScreen() {
  const params = useLocalSearchParams<{ projectId: string }>();
  const { organization, loading: workspaceLoading } = useWorkspace();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingProjectStatus, setUpdatingProjectStatus] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [showTaskDuePicker, setShowTaskDuePicker] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const projectId = useMemo(() => {
    const rawProjectId = params.projectId;
    return Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  }, [params.projectId]);

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "done").length,
    [tasks]
  );

  function formatDateForDatabase(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatDateForDisplay(dateString: string | null) {
    if (!dateString) {
      return "Not set";
    }

    if (dateString.includes("T")) {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
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

  function dateStringToTimestamp(dateString: string) {
    if (!dateString) {
      return null;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0).toISOString();
  }

  function handleTaskDueDateChange(_event: unknown, selectedDate?: Date) {
    if (Platform.OS === "android") {
      setShowTaskDuePicker(false);
    }

    if (selectedDate) {
      setTaskDueDate(formatDateForDatabase(selectedDate));
    }
  }

  async function loadProjectAndTasks() {
    if (!organization?.id || !projectId) {
      setProject(null);
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("organization_id", organization.id)
        .maybeSingle();

      if (projectError) {
        throw projectError;
      }

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (taskError) {
        throw taskError;
      }

      setProject(projectData);
      setTasks(taskData ?? []);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load project.";

      Alert.alert("Project failed to load", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadProjectAndTasks();
    setRefreshing(false);
  }

  async function updateProjectStatus(status: ProjectStatus) {
    if (!organization?.id || !project?.id) {
      return;
    }

    try {
      setUpdatingProjectStatus(status);

      const { error } = await supabase
        .from("projects")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)
        .eq("organization_id", organization.id);

      if (error) {
        throw error;
      }

      setProject((currentProject) =>
        currentProject ? { ...currentProject, status } : currentProject
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update project status.";

      Alert.alert("Status update failed", message);
    } finally {
      setUpdatingProjectStatus(null);
    }
  }

  async function createTask() {
    if (!organization?.id || !project?.id) {
      Alert.alert("Missing project", "Project was not loaded.");
      return;
    }

    if (!taskTitle.trim()) {
      Alert.alert("Missing task", "Enter a task title first.");
      return;
    }

    try {
      setCreatingTask(true);

      const { error } = await supabase.from("tasks").insert({
        organization_id: organization.id,
        project_id: project.id,
        client_id: project.client_id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        status: "todo",
        priority: taskPriority.trim() || "medium",
        due_at: dateStringToTimestamp(taskDueDate),
      });

      if (error) {
        throw error;
      }

      setTaskTitle("");
      setTaskPriority("medium");
      setTaskDueDate("");
      setTaskDescription("");

      await loadProjectAndTasks();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create task.";

      Alert.alert("Task creation failed", message);
    } finally {
      setCreatingTask(false);
    }
  }

  async function updateTaskStatus(task: Task, status: TaskStatus) {
    if (!organization?.id) {
      return;
    }

    try {
      setUpdatingTaskId(task.id);

      const { error } = await supabase
        .from("tasks")
        .update({
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id)
        .eq("organization_id", organization.id);

      if (error) {
        throw error;
      }

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                status,
                completed_at:
                  status === "done" ? new Date().toISOString() : null,
              }
            : currentTask
        )
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update task.";

      Alert.alert("Task update failed", message);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  useEffect(() => {
    if (!workspaceLoading) {
      loadProjectAndTasks();
    }
  }, [workspaceLoading, organization?.id, projectId]);

  if (workspaceLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Pressable onPress={() => router.replace("/projects")}>
            <Text style={styles.backText}>← Back to Projects</Text>
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.title}>Project Not Found</Text>
            <Text style={styles.subtitle}>
              This project may have been deleted or you may not have access.
            </Text>
          </View>
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
        <Pressable onPress={() => router.replace("/projects")}>
          <Text style={styles.backText}>← Back to Projects</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Project Detail</Text>
          <Text style={styles.title}>{project.name}</Text>
          <Text style={styles.subtitle}>
            Manage project status, execution tasks, timeline, and delivery
            progress inside Kras OS.
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{project.status}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Tasks</Text>
            <Text style={styles.metricValue}>{tasks.length}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Completed</Text>
            <Text style={styles.metricValue}>{completedTasks}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Project Status</Text>

          <View style={styles.statusGrid}>
            {PROJECT_STATUSES.map((status) => {
              const isActive = project.status === status;
              const isUpdating = updatingProjectStatus === status;

              return (
                <Pressable
                  key={status}
                  style={[
                    styles.statusButton,
                    isActive && styles.statusButtonActive,
                  ]}
                  onPress={() => updateProjectStatus(status)}
                  disabled={!!updatingProjectStatus}
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
          <Text style={styles.sectionTitle}>Project Info</Text>

          <InfoRow label="Type" value={project.type} />
          <InfoRow label="Priority" value={project.priority} />
          <InfoRow label="Start Date" value={formatDateForDisplay(project.start_date)} />
          <InfoRow label="Due Date" value={formatDateForDisplay(project.due_date)} />
          <InfoRow label="Description" value={project.description} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Create Task</Text>

          <TextInput
            style={styles.input}
            placeholder="Task title"
            placeholderTextColor="#8a96a3"
            value={taskTitle}
            onChangeText={setTaskTitle}
          />

          <TextInput
            style={styles.input}
            placeholder="Priority: low, medium, high, urgent"
            placeholderTextColor="#8a96a3"
            value={taskPriority}
            onChangeText={setTaskPriority}
            autoCapitalize="none"
          />

          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowTaskDuePicker(true)}
            >
              <Text
                style={[
                  styles.dateButtonText,
                  !taskDueDate && styles.dateButtonPlaceholder,
                ]}
              >
                {taskDueDate ? formatDateForDisplay(taskDueDate) : "Select date"}
              </Text>
            </Pressable>

            {taskDueDate ? (
              <Pressable onPress={() => setTaskDueDate("")}>
                <Text style={styles.clearDateText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {showTaskDuePicker ? (
            <DateTimePicker
              value={dateFromString(taskDueDate)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleTaskDueDateChange}
            />
          ) : null}

          {Platform.OS === "ios" && showTaskDuePicker ? (
            <Pressable
              style={styles.doneDateButton}
              onPress={() => setShowTaskDuePicker(false)}
            >
              <Text style={styles.doneDateButtonText}>Done Selecting Date</Text>
            </Pressable>
          ) : null}

          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Task description"
            placeholderTextColor="#8a96a3"
            value={taskDescription}
            onChangeText={setTaskDescription}
            multiline
          />

          <Pressable
            style={[styles.primaryButton, creatingTask && styles.buttonDisabled]}
            onPress={createTask}
            disabled={creatingTask}
          >
            <Text style={styles.primaryButtonText}>
              {creatingTask ? "Creating..." : "Create Task"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Task List</Text>

          {tasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyText}>
                Create the first execution task for this project.
              </Text>
            </View>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskTopRow}>
                  <View style={styles.taskMainInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskMeta}>
                      {task.priority} priority • Due {formatDateForDisplay(task.due_at)}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{task.status}</Text>
                  </View>
                </View>

                {task.description ? (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                ) : null}

                <View style={styles.taskStatusRow}>
                  {TASK_STATUSES.map((status) => {
                    const isActive = task.status === status;
                    const isUpdating = updatingTaskId === task.id;

                    return (
                      <Pressable
                        key={status}
                        style={[
                          styles.miniStatusButton,
                          isActive && styles.miniStatusButtonActive,
                        ]}
                        onPress={() => updateTaskStatus(task, status)}
                        disabled={isUpdating}
                      >
                        <Text
                          style={[
                            styles.miniStatusButtonText,
                            isActive && styles.miniStatusButtonTextActive,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
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
    gap: 12,
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
    fontSize: 30,
    fontWeight: "900",
    color: "#16202a",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#16202a",
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
  descriptionInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  dateField: {
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
  primaryButton: {
    backgroundColor: "#00bfff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
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
  taskCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#d9e0e7",
    gap: 10,
  },
  taskTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  taskMainInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#16202a",
  },
  taskMeta: {
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
  taskDescription: {
    color: "#52606d",
    lineHeight: 20,
  },
  taskStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  miniStatusButton: {
    backgroundColor: "#f4f6f8",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  miniStatusButtonActive: {
    backgroundColor: "#00bfff",
    borderColor: "#00bfff",
  },
  miniStatusButtonText: {
    color: "#52606d",
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 11,
  },
  miniStatusButtonTextActive: {
    color: "#ffffff",
  },
});
