import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../src/features/auth/AuthProvider";

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleResetPassword() {
    if (!email.trim()) {
      Alert.alert("Missing email", "Enter your email first.");
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword(email);
      Alert.alert("Check your email", "A password reset link has been sent.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send reset email.";
      Alert.alert("Reset failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Kras OS</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and Supabase will send a reset link.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8a96a3"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Sending..." : "Send Reset Link"}
          </Text>
        </Pressable>

        <Link href="/login" style={styles.link}>
          Back to login
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f4f6f8",
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
  input: {
    borderWidth: 1,
    borderColor: "#d9e0e7",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#16202a",
    backgroundColor: "#f9fafb",
    marginBottom: 12,
  },
  button: {
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
  link: {
    marginTop: 18,
    color: "#16202a",
    fontWeight: "700",
    textAlign: "center",
  },
});
