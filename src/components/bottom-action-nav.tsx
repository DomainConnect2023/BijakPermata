import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND_COLOR = "#208AEF";

type NavKey = "dashboard" | "report" | "back";

type NavItem = {
  key: NavKey;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "home-outline" },
  { key: "report", label: "Report", icon: "document-text-outline" },
  { key: "back", label: "Back", icon: "arrow-back-outline" },
];

// Shared bottom navigation bar shown on every screen — lets the user jump
// to the dashboard, open the report picker (/report-menu), or go back one
// screen, without needing the drawer.
export function BottomActionNav() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handlePress(key: NavKey) {
    if (key === "dashboard") {
      // `navigate` (not `push`) — reuses the dashboard screen if it's
      // already in the stack instead of stacking a duplicate on top.
      router.navigate("/dashboard");
    } else if (key === "report") {
      router.navigate("/report-menu");
    } else {
      // Goes back to whatever screen was actually visited before this one
      // (real navigation history), never a hardcoded destination. If there
      // is nowhere to go back to (this screen is the root), fall back to
      // the dashboard instead of doing nothing.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.navigate("/dashboard");
      }
    }
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {NAV_ITEMS.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => handlePress(item.key)}
          style={({ pressed }) => [
            styles.item,
            pressed && styles.itemPressed,
          ]}
        >
          <Ionicons name={item.icon} size={20} color={BRAND_COLOR} />
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 4,
  },
  itemPressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLOR,
  },
});
