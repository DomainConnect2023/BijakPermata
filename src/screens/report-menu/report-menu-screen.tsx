import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { REPORT_ITEMS } from "@/constants/report-items";

const BRAND_COLOR = "#208AEF";

export function ReportMenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        data={REPORT_ITEMS}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/${item.name}` as never)}
            style={({ pressed }) => [
              styles.reportRow,
              pressed && styles.reportRowPressed,
            ]}
          >
            <View style={styles.reportIcon}>
              <Ionicons name={item.icon} size={20} color={BRAND_COLOR} />
            </View>
            <Text style={styles.reportTitle}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reportRowPressed: {
    opacity: 0.7,
  },
  reportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${BRAND_COLOR}15`,
  },
  reportTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
});
