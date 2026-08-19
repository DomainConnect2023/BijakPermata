import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";

type Props = {
  message?: string;
};

export function AccessDeniedView({
  message = "You don't have permission to view this page.",
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={40} color="#9CA3AF" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    backgroundColor: "#F9FAFB",
    padding: Spacing.four,
  },
  text: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
