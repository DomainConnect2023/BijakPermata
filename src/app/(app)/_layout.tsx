import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Drawer } from "expo-router/drawer";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";

const BRAND_COLOR = "#208AEF";
const SCREEN_WIDTH = Dimensions.get("window").width;

const MENU_ITEMS: {
  name: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  activeIcon?: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    name: "dashboard",
    title: "Dashboard",
    icon: "home-outline",
    activeIcon: "home",
  },
  {
    name: "purchasing",
    title: "Purchasing",
    icon: "cart-outline",
    activeIcon: "cart",
  },
  {
    name: "sales",
    title: "Sales",
    icon: "trending-up-outline",
    activeIcon: "trending-up",
  },
  {
    name: "margin",
    title: "Margin",
    icon: "analytics-outline",
    activeIcon: "analytics",
  },
  {
    name: "daily",
    title: "Daily",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    name: "finance",
    title: "Finance",
    icon: "wallet-outline",
    activeIcon: "wallet",
  },
  {
    name: "transaction",
    title: "Transaction",
    icon: "swap-horizontal-outline",
    activeIcon: "swap-horizontal",
  },
  {
    name: "setting",
    title: "Setting",
    icon: "settings-outline",
    activeIcon: "settings",
  },
];

function CustomDrawerContent({ navigation, state, ...props }: any) {
  const { logout } = useAuth();
  const theme = useTheme();
  const activeRoute = state?.routes[state.index]?.name;

  return (
    <SafeAreaView
      style={[styles.drawerContainer, { backgroundColor: theme.background }]}
    >
      {/* Header Section */}
      <View
        style={[
          styles.headerSection,
          { borderBottomColor: theme.border || "rgba(0,0,0,0.05)" },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
          />
        </View>
        <ThemedText type="title" style={styles.brandName}>
          Bijak Permata
        </ThemedText>
        <View style={styles.badgeContainer}>
          <ThemedText type="small" style={styles.badgeText}>
            v1.0.0
          </ThemedText>
        </View>
      </View>

      {/* Menu Items - 使用自定义 Pressable 替代 DrawerItem */}
      <ScrollView
        style={styles.menuSection}
        contentContainerStyle={styles.menuSectionContent}
        showsVerticalScrollIndicator={false}
      >
        {MENU_ITEMS.map((item) => {
          const isActive = activeRoute === item.name;
          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              style={({ pressed }) => [
                styles.menuItem,
                isActive && styles.activeMenuItem,
                isActive && { backgroundColor: BRAND_COLOR },
                pressed && styles.menuItemPressed,
              ]}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isActive ? item.activeIcon || item.icon : item.icon}
                    color={isActive ? "#FFFFFF" : theme.textSecondary}
                    size={24}
                  />
                </View>
                <ThemedText
                  style={[
                    styles.menuLabel,
                    isActive && styles.activeMenuLabel,
                    { color: isActive ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {item.title}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer Section */}
      <View
        style={[
          styles.footerSection,
          { borderTopColor: theme.border || "rgba(0,0,0,0.05)" },
        ]}
      >
        <Pressable style={styles.footerItem} onPress={() => logout()}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={theme.textSecondary}
          />
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.footerText}
          >
            Logout
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Drawer
      initialRouteName="dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTintColor: theme.text,
        headerStyle: {
          backgroundColor: theme.background,
          shadowColor: "transparent",
          elevation: 0,
        },
        drawerStyle: {
          backgroundColor: theme.background,
          width: SCREEN_WIDTH * 0.8,
          maxWidth: 320,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 8,
        },
        drawerActiveTintColor: "#FFFFFF",
        drawerInactiveTintColor: theme.textSecondary,
        drawerActiveBackgroundColor: BRAND_COLOR,
        drawerLabelStyle: {
          marginLeft: -8,
          fontSize: 15,
          fontWeight: "500",
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 12,
          marginVertical: 2,
        },
        overlayColor: "rgba(0,0,0,0.4)",
      }}
    >
      {MENU_ITEMS.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            drawerIcon: ({ color, size }) => (
              <Ionicons name={item.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  badgeContainer: {
    backgroundColor: "rgba(32, 138, 239, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: BRAND_COLOR,
    fontSize: 10,
    fontWeight: "600",
  },
  menuSection: {
    flex: 1,
  },
  menuSectionContent: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  menuItem: {
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeMenuItem: {
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  activeMenuLabel: {
    fontWeight: "600",
  },
  footerSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 4,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
