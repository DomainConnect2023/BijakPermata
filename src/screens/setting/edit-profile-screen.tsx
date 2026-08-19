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

const BRAND_COLOR = "#208AEF";

export function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [userCode, setUserCode] = useState(user?.code ?? "");
  const [userName, setUserName] = useState(user?.username ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    userCode.trim().length > 0 && userName.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await updateProfile(userCode, userName);
      Alert.alert("Success", "Profile updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update profile";
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
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(userName || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>User Code</Text>
            <TextInput
              value={userCode}
              onChangeText={(value) => {
                setUserCode(value);
                setError(null);
              }}
              placeholder="User Code"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, error && styles.inputError]}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>User Name</Text>
            <TextInput
              value={userName}
              onChangeText={(value) => {
                setUserName(value);
                setError(null);
              }}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
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
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  avatarWrapper: {
    alignItems: "center",
    marginBottom: Spacing.five,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#208AEF12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#208AEF20",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: BRAND_COLOR,
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
