import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import { Spacing } from "@/constants/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CollapsibleFilterSectionProps = {
  expanded: boolean;
  onToggle: () => void;
  summary?: string;
  children: ReactNode;
  activeColor?: string;
};

export function CollapsibleFilterSection({
  expanded,
  onToggle,
  summary,
  children,
  activeColor = "#208AEF",
}: CollapsibleFilterSectionProps) {
  function handleToggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }

  return (
    <View>
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.toggleRow,
          pressed && styles.toggleRowPressed,
        ]}
      >
        <View style={styles.toggleTextGroup}>
          <Ionicons name="options-outline" size={16} color={activeColor} />
          <Text style={styles.toggleLabel}>Filters</Text>
          {!expanded && summary ? (
            <Text style={styles.toggleSummary} numberOfLines={1}>
              {summary}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9CA3AF"
        />
      </Pressable>
      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    paddingVertical: 4,
  },
  toggleRowPressed: {
    opacity: 0.7,
  },
  toggleTextGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  toggleSummary: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  body: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
