import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AccessDeniedView } from "@/components/access-denied-view";
import { Spacing } from "@/constants/theme";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  type ApiAccessUser,
  fetchAccessUserList,
  updateAccessUsers,
} from "@/services/access-api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND_COLOR = "#208AEF";

type Props = {
  accessId: number;
  accessCode: string;
  accessName: string;
};

export function AccessDetailScreen({
  accessId,
  accessCode,
  accessName,
}: Props) {
  const insets = useSafeAreaInsets();
  const { loading: permissionLoading, access: permission } = usePageAccess([
    "ViewAccess",
  ]);

  const [users, setUsers] = useState<ApiAccessUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    new Set(),
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setErrorMessage(null);
    try {
      const list = await fetchAccessUserList(accessId);
      setUsers(list);
      setSelectedUserIds(
        new Set(
          list.filter((user) => user.hasAccess).map((user) => user.userId),
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load users",
      );
    }
  }, [accessId]);

  useEffect(() => {
    if (permissionLoading || !permission.ViewAccess) return;
    (async () => {
      setLoading(true);
      await loadUsers();
      setLoading(false);
    })();
  }, [loadUsers, permissionLoading, permission.ViewAccess]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.userName.toLowerCase().includes(query) ||
        user.code.toLowerCase().includes(query),
    );
  }, [users, search]);

  function toggleUser(userId: number) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!permission.ViewAccess) return;

    setSaving(true);
    setErrorMessage(null);
    try {
      await updateAccessUsers({
        accessId,
        userIds: Array.from(selectedUserIds),
      });
      await loadUsers();
      Alert.alert("Success", "Access updated successfully.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save access";
      setErrorMessage(message);
      Alert.alert("Failed", message);
    } finally {
      setSaving(false);
    }
  }

  if (permissionLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={BRAND_COLOR} size="large" />
      </View>
    );
  }

  if (!permission.ViewAccess) {
    return (
      <AccessDeniedView message="You don't have permission to view this access." />
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-outline" size={22} color="#8B5CF6" />
        </View>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitle}>
            {accessCode} - {accessName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedUserIds.size} user(s) with access
          </Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or code"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={BRAND_COLOR} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Ionicons name="people-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const checked = selectedUserIds.has(item.userId);
            return (
              <Pressable
                onPress={() => toggleUser(item.userId)}
                style={({ pressed }) => [
                  styles.userRow,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.userName}</Text>
                  <Text style={styles.userCode}>{item.code}</Text>
                </View>
                <Ionicons
                  name={checked ? "checkbox" : "square-outline"}
                  size={24}
                  color={checked ? BRAND_COLOR : "#9CA3AF"}
                />
              </Pressable>
            );
          }}
        />
      )}

      {errorMessage && (
        <Text style={styles.errorBannerText}>{errorMessage}</Text>
      )}

      <Pressable
        onPress={handleSave}
        disabled={saving || loading}
        style={({ pressed }) => [
          styles.saveButton,
          { opacity: saving ? 0.7 : pressed ? 0.85 : 1 },
        ]}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: Spacing.three,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#8B5CF610",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  userCode: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  errorBannerText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: BRAND_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
