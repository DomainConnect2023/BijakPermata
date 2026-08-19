import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AccessDeniedView } from "@/components/access-denied-view";
import { Spacing } from "@/constants/theme";
import { usePageAccess } from "@/hooks/use-page-access";
import { type ApiAccess, fetchAccessList } from "@/services/access-api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND_COLOR = "#208AEF";

export function AccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loading: permissionLoading, access: permission } = usePageAccess([
    "ViewAccess",
  ]);

  const [accessList, setAccessList] = useState<ApiAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAccessList = useCallback(async () => {
    setErrorMessage(null);
    try {
      const list = await fetchAccessList();
      setAccessList(list);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load access list",
      );
    }
  }, []);

  useEffect(() => {
    if (permissionLoading || !permission.ViewAccess) return;
    (async () => {
      setLoading(true);
      await loadAccessList();
      setLoading(false);
    })();
  }, [loadAccessList, permissionLoading, permission.ViewAccess]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAccessList();
    setRefreshing(false);
  }, [loadAccessList]);

  if (permissionLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={BRAND_COLOR} size="large" />
      </View>
    );
  }

  if (!permission.ViewAccess) {
    return (
      <AccessDeniedView message="You don't have permission to view access control." />
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={BRAND_COLOR} size="large" />
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={loadAccessList} style={styles.retryButton}>
            <Ionicons name="refresh" size={16} color={BRAND_COLOR} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={accessList}
          keyExtractor={(item) => String(item.accessId)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Ionicons name="shield-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No access items found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/setting-access-detail",
                  params: {
                    accessId: String(item.accessId),
                    accessCode: item.accessCode,
                    accessName: item.accessName,
                  },
                })
              }
              style={({ pressed }) => [
                styles.accessCard,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="shield-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.accessInfo}>
                <Text style={styles.accessName}>{item.accessCode}</Text>
                <View style={styles.accessCodeRow}>
                  <Ionicons name="key-outline" size={12} color="#6B7280" />
                  <Text style={styles.accessCode}>{item.accessName}</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#9CA3AF"
              />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  retryText: {
    color: BRAND_COLOR,
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  accessCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#8B5CF610",
    alignItems: "center",
    justifyContent: "center",
  },
  accessInfo: {
    flex: 1,
  },
  accessName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  accessCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accessCode: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});
