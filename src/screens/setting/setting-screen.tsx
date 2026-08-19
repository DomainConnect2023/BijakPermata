import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { usePageAccess } from "@/hooks/use-page-access";

export function SettingScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { loading: permissionLoading, access } = usePageAccess([
    "ViewUser",
    "ViewAccess",
  ]);
  const showAdminSection =
    !permissionLoading && (access.ViewUser || access.ViewAccess);

  const userData = {
    name: user?.username || "John Doe",
    code: user?.code || "EMP001",
  };

  const handleEditProfile = () => {
    router.push("/setting-edit-profile");
  };

  const handleChangePassword = () => {
    router.push("/setting-change-password");
  };

  const handleUserManagement = () => {
    router.push("/setting-users");
  };

  const handleAccessControl = () => {
    router.push("/setting-access");
  };

  const handleLogout = () => {
    logout();
  };

  if (permissionLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
        <Text style={styles.loadingText}>Loading Permission...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {userData.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusDot} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userData.name}</Text>
              <View style={styles.userCodeContainer}>
                <Ionicons name="briefcase-outline" size={14} color="#6B7280" />
                <Text style={styles.userCode}>{userData.code}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 账户设置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionLine} />
          </View>
          <View style={styles.menuCard}>
            <Pressable
              onPress={handleEditProfile}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, styles.menuIconBrand]}>
                  <Ionicons name="person-outline" size={22} color="#208AEF" />
                </View>
                <Text style={styles.menuItemTitle}>Edit Profile</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#9CA3AF"
              />
            </Pressable>

            <Pressable
              onPress={handleChangePassword}
              style={({ pressed }) => [
                styles.menuItem,
                styles.menuItemLast,
                pressed && styles.menuItemPressed,
              ]}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, styles.menuIconWarning]}>
                  <Ionicons name="key-outline" size={22} color="#F59E0B" />
                </View>
                <Text style={styles.menuItemTitle}>Change Password</Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#9CA3AF"
              />
            </Pressable>
          </View>
        </View>

        {/* 管理设置 */}
        {showAdminSection && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Administration</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.menuCard}>
              {access.ViewUser && (
                <Pressable
                  onPress={handleUserManagement}
                  style={({ pressed }) => [
                    styles.menuItem,
                    !access.ViewAccess && styles.menuItemLast,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, styles.menuIconSuccess]}>
                      <Ionicons
                        name="people-outline"
                        size={22}
                        color="#22C55E"
                      />
                    </View>
                    <Text style={styles.menuItemTitle}>User Management</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>
              )}

              {access.ViewAccess && (
                <Pressable
                  onPress={handleAccessControl}
                  style={({ pressed }) => [
                    styles.menuItem,
                    styles.menuItemLast,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, styles.menuIconPurple]}>
                      <Ionicons
                        name="shield-outline"
                        size={22}
                        color="#8B5CF6"
                      />
                    </View>
                    <Text style={styles.menuItemTitle}>Access Control</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* 登出按钮 - 重新设计 */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        {/* 版本信息 */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const BRAND_COLOR = "#208AEF";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
  },
  headerWrapper: {
    marginBottom: Spacing.four,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 4,
  },
  // 用户卡片 - 全新设计
  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.five,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: Spacing.three,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#208AEF12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#208AEF20",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  userCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userCode: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  // 区块
  section: {
    marginBottom: Spacing.four,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.two,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 12,
  },
  // 菜单卡片
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemPressed: {
    backgroundColor: "#F9FAFB",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconBrand: {
    backgroundColor: "#208AEF10",
  },
  menuIconWarning: {
    backgroundColor: "#F59E0B10",
  },
  menuIconSuccess: {
    backgroundColor: "#22C55E10",
  },
  menuIconPurple: {
    backgroundColor: "#8B5CF610",
  },
  menuIconInfo: {
    backgroundColor: "#3B82F610",
  },
  menuIconIndigo: {
    backgroundColor: "#6366F110",
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  // 登出按钮 - 全新设计
  logoutButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutButtonPressed: {
    backgroundColor: "#FEE2E2",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    marginTop: Spacing.five,
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
