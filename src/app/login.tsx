import Constants from "expo-constants";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInput as TextInputType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const theme = useTheme();

  const [usercode, setUsercode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordInputRef = useRef<TextInputType>(null);

  const canSubmit =
    usercode.trim().length > 0 && password.trim().length > 0 && !submitting;

  async function handleLogin() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(usercode, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({
          ios: "padding",
          android: "height",
          default: "height",
        })}
        keyboardVerticalOffset={Platform.select({
          ios: 0,
          android: -50,
        })}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <ThemedView style={styles.logoSection}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.logo}
                />
              </View>
              <ThemedText type="title" style={styles.title}>
                Bijak Permata
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.subtitle}
              >
                Welcome Back
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.form}>
              <View style={styles.inputWrapper}>
                <ThemedText type="small" style={styles.label}>
                  User Code
                </ThemedText>
                <TextInput
                  value={usercode}
                  onChangeText={(value) => {
                    setUsercode(value);
                    setError(null);
                  }}
                  placeholder="User Code"
                  placeholderTextColor={theme.textSecondary + "80"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: error ? "#E5484D" : "transparent",
                    },
                  ]}
                  selectionColor={BRAND_COLOR}
                />
              </View>

              <View style={styles.inputWrapper}>
                <ThemedText type="small" style={styles.label}>
                  Password
                </ThemedText>
                <TextInput
                  ref={passwordInputRef}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError(null);
                  }}
                  placeholder="Password"
                  placeholderTextColor={theme.textSecondary + "80"}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: error ? "#E5484D" : "transparent",
                    },
                  ]}
                  selectionColor={BRAND_COLOR}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorIcon}>✕</ThemedText>
                  <ThemedText type="small" style={styles.error}>
                    {error}
                  </ThemedText>
                </View>
              )}

              <Pressable
                onPress={handleLogin}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.button,
                  {
                    opacity: !canSubmit ? 0.6 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed && canSubmit ? 0.98 : 1 }],
                  },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <ThemedText type="smallBold" style={styles.buttonText}>
                    Login
                  </ThemedText>
                )}
              </Pressable>

              {/* Spacer to ensure content can scroll above keyboard */}
              <View style={styles.bottomSpacer} />
            </ThemedView>

            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.version}
            >
              v{Constants.expoConfig?.version}
            </ThemedText>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const BRAND_COLOR = "#208AEF";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  logoWrapper: {
    width: 112,
    height: 112,
    borderRadius: Spacing.four,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: Spacing.three,
  },
  title: {
    textAlign: "center",
    marginTop: Spacing.two,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    marginTop: -Spacing.one,
  },
  form: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  inputWrapper: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: Spacing.one,
  },
  input: {
    height: 54,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    borderWidth: 1.5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    backgroundColor: "#E5484D12",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: "#E5484D30",
  },
  errorIcon: {
    color: "#E5484D",
    fontSize: 14,
    fontWeight: "700",
    marginRight: Spacing.one,
  },
  error: {
    color: "#E5484D",
    flex: 1,
  },
  button: {
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
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  version: {
    textAlign: "center",
    position: "absolute",
    bottom: Spacing.four,
    alignSelf: "center",
    opacity: 0.6,
  },
  bottomSpacer: {
    height: Platform.select({ ios: 20, android: 10 }),
  },
});
