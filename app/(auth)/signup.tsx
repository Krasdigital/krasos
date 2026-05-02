import { Link, router } from "expo-router";
import { useState } from "react";
import {
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

import { useAuth } from "../../src/features/auth/AuthProvider";

export default function SignupScreen() {
  const { signUpAndCreateWorkspace } = useAuth();

  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("Kras Digital");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function handleSignup() {
    if (!fullName.trim() || !organizationName.trim() || !email.trim() || !password) {
      Alert.alert("Missing info", "Fill out every field to create your workspace.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await signUpAndCreateWorkspace({
        fullName,
        organizationName,
        email,
        password,
      });

      if (result.needsEmailConfirmation) {
        Alert.alert(
          "Confirm your email",
          "Check your inbox, confirm your email, then log in."
        );
        router.replace("/login");
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create account.";
      Alert.alert("Signup failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Kras OS</Text>
          <Text style={styles.title}>Create Workspace</Text>
          <Text style={styles.subtitle}>
            Start the secure command center for Kras Digital.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#8a96a3"
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Organization name"
              placeholderTextColor="#8a96a3"
              value={organizationName}
              onChangeText={setOrganizationName}
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
              placeholder="Password"
              placeholderTextColor="#8a96a3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={submitting}
            >
              <Text style={styles.buttonText}>
                {submitting ? "Creating..." : "Create Account"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Link href="/login" style={styles.footerLink}>
              Sign in
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#d9e0e7",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#5f6b76",
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#16202a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#52606d",
    marginBottom: 24,
  },
  form: {
    gap: 12,
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
  button: {
    marginTop: 4,
    backgroundColor: "#16202a",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
  },
  footerText: {
    marginTop: 18,
    color: "#52606d",
    textAlign: "center",
  },
  footerLink: {
    color: "#16202a",
    fontWeight: "800",
  },
});
