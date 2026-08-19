import { useRouter } from "expo-router";
import { useState } from "react";
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

import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { changePassword } from "@/services/user-api";

const BRAND_COLOR = "#208AEF";

export function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit || !user) return;

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await changePassword({
        userId: user.userId,
        oldPassword,
        newPassword,
      });
      Alert.alert("Success", "Password updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to update password";
      setError(message);
      Alert.alert("Failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              value={oldPassword}
              onChangeText={(value) => {
                setOldPassword(value);
                setError(null);
              }}
              placeholder="Current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, error && styles.inputError]}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                setError(null);
              }}
              placeholder="New password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, error && styles.inputError]}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setError(null);
              }}
              placeholder="Re-enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, error && styles.inputError]}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.saveButton,
              { opacity: !canSubmit ? 0.6 : pressed ? 0.85 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: Spacing.four,
    paddingTop: Spacing.six,
  },
  form: {
    gap: Spacing.three,
  },
  inputWrapper: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: Spacing.one,
  },
  input: {
    height: 52,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  inputError: {
    borderColor: "#E5484D",
  },
  errorText: {
    color: "#E5484D",
    fontSize: 13,
  },
  saveButton: {
    height: 54,
    borderRadius: Spacing.three,
    backgroundColor: BRAND_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.one,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
