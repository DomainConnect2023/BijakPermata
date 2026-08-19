import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AccessDeniedView } from "@/components/access-denied-view";
import { Spacing } from "@/constants/theme";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  type PurchaseSalesGroup,
  fetchPurchaseSales,
  formatDateParam,
} from "@/services/report-api";

const BRAND_COLOR = "#208AEF";

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type ActivePicker = "from" | "to" | null;

export function PurchaseDetailReportScreen() {
  const router = useRouter();
  const { loading: permissionLoading, access } = usePageAccess([
    "PurchaseDetail",
  ]);

  const [fromDate, setFromDate] = useState(startOfDay(new Date()));
  const [toDate, setToDate] = useState(startOfDay(new Date()));
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const [groups, setGroups] = useState<PurchaseSalesGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReport = useCallback(async (from: Date, to: Date) => {
    setErrorMessage(null);
    try {
      const data = await fetchPurchaseSales(from, to, "B");
      setGroups(
        data.filter((group) => group.currency && group.currency !== "0"),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load report",
      );
    }
  }, []);

  useEffect(() => {
    if (permissionLoading || !access.PurchaseDetail) return;
    (async () => {
      setLoading(true);
      await loadReport(fromDate, toDate);
      setLoading(false);
    })();
  }, [fromDate, toDate, loadReport, permissionLoading, access.PurchaseDetail]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport(fromDate, toDate);
    setRefreshing(false);
  }, [fromDate, toDate, loadReport]);

  function handleValueChange(
    _event: DateTimePickerChangeEvent,
    selected: Date,
  ) {
    if (activePicker === "from") {
      setFromDate(selected);
      if (selected > toDate) setToDate(selected);
    } else if (activePicker === "to") {
      setToDate(selected);
      if (selected < fromDate) setFromDate(selected);
    }
    if (Platform.OS === "android") {
      setActivePicker(null);
    }
  }

  function handleDismiss() {
    setActivePicker(null);
  }

  function openCurrency(group: PurchaseSalesGroup) {
    router.push({
      pathname: "/purchase-detail-transactions",
      params: {
        currency: group.currency,
        fromDate: formatDateParam(fromDate),
        toDate: formatDateParam(toDate),
      },
    });
  }

  const totalTransactions = groups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const totalRM = groups.reduce(
    (sum, group) =>
      sum + group.items.reduce((itemSum, item) => itemSum + item.rm, 0),
    0,
  );

  if (permissionLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  if (!access.PurchaseDetail) {
    return (
      <AccessDeniedView message="You don't have permission to view this report." />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.dateRangeRow}>
          <Pressable
            onPress={() => setActivePicker("from")}
            style={({ pressed }) => [
              styles.dateSelector,
              pressed && styles.dateSelectorPressed,
            ]}
          >
            <Ionicons name="calendar-outline" size={18} color={BRAND_COLOR} />
            <View>
              <Text style={styles.dateSelectorLabel}>From</Text>
              <Text style={styles.dateText}>{formatDisplayDate(fromDate)}</Text>
            </View>
          </Pressable>

          <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />

          <Pressable
            onPress={() => setActivePicker("to")}
            style={({ pressed }) => [
              styles.dateSelector,
              pressed && styles.dateSelectorPressed,
            ]}
          >
            <Ionicons name="calendar-outline" size={18} color={BRAND_COLOR} />
            <View>
              <Text style={styles.dateSelectorLabel}>To</Text>
              <Text style={styles.dateText}>{formatDisplayDate(toDate)}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {!loading && !errorMessage && groups.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{totalTransactions}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total RM</Text>
            <Text style={styles.summaryValue}>RM {formatAmount(totalRM)}</Text>
          </View>
        </View>
      )}

      {Platform.OS === "android" && activePicker !== null && (
        <DateTimePicker
          value={activePicker === "from" ? fromDate : toDate}
          mode="date"
          display="default"
          maximumDate={startOfDay(new Date())}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={activePicker !== null}
          transparent
          animationType="slide"
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setActivePicker(null)}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {activePicker === "from" ? "From" : "To"} Date
                </Text>
                <Pressable onPress={() => setActivePicker(null)}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              {activePicker !== null && (
                <DateTimePicker
                  value={activePicker === "from" ? fromDate : toDate}
                  mode="date"
                  display="spinner"
                  maximumDate={startOfDay(new Date())}
                  onValueChange={handleValueChange}
                />
              )}
            </View>
          </Pressable>
        </Modal>
      )}

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={BRAND_COLOR} />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            onPress={() => loadReport(fromDate, toDate)}
            style={styles.retryButton}
          >
            <Ionicons name="refresh-outline" size={18} color={BRAND_COLOR} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(group) => group.currency}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={BRAND_COLOR}
              colors={[BRAND_COLOR]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Ionicons name="cart-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No purchases found</Text>
              <Text style={styles.emptySubtext}>for this date range</Text>
            </View>
          }
          renderItem={({ item: group }) => (
            <Pressable
              onPress={() => openCurrency(group)}
              style={({ pressed }) => [
                styles.currencyCard,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeText}>{group.currency.trim()}</Text>
              </View>
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyAmount}>
                  {group.currency.trim()} {formatAmount(group.totalFCAmount)}
                </Text>
                <Text style={styles.currencySubtext}>
                  {group.items.length} transaction
                  {group.items.length === 1 ? "" : "s"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#9CA3AF"
              />
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  headerSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  dateSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateSelectorPressed: {
    opacity: 0.7,
  },
  dateSelectorLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? Spacing.four : 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  modalDone: {
    fontSize: 16,
    fontWeight: "600",
    color: BRAND_COLOR,
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
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginTop: Spacing.two,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  retryText: {
    color: BRAND_COLOR,
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.four,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  currencyCard: {
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
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1",
  },
  currencyInfo: {
    flex: 1,
  },
  currencyAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  currencySubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});
