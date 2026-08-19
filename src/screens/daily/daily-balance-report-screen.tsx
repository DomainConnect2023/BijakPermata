import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
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
  type DailyBalanceItem,
  fetchDailyBalance,
} from "@/services/report-api";

const BRAND_COLOR = "#208AEF";

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

export function DailyBalanceReportScreen() {
  const { loading: permissionLoading, access } = usePageAccess([
    "DailyBalance",
  ]);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [items, setItems] = useState<DailyBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReport = useCallback(async (forDate: Date) => {
    setErrorMessage(null);
    try {
      const data = await fetchDailyBalance(forDate);
      setItems(data.filter((item) => item.currency && item.currency !== "0"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load report",
      );
    }
  }, []);

  useEffect(() => {
    if (permissionLoading || !access.DailyBalance) return;
    (async () => {
      setLoading(true);
      await loadReport(date);
      setLoading(false);
    })();
  }, [date, loadReport, permissionLoading, access.DailyBalance]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport(date);
    setRefreshing(false);
  }, [date, loadReport]);

  function handleValueChange(
    _event: DateTimePickerChangeEvent,
    selected: Date,
  ) {
    setDate(selected);
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
  }

  function handleDismiss() {
    setShowPicker(false);
  }

  const totalBalance = items.reduce(
    (sum, item) => sum + item.closingBalance * (item.rate / 100),
    0,
  );

  const renderCurrencyItem = ({ item }: { item: DailyBalanceItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.currencyCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyCode}>{item.currency}</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceValue}>
            {formatAmount(item.closingBalance)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, styles.statIn]}>
              <Ionicons name="arrow-up" size={12} color="#22C55E" />
            </View>
            <View>
              <Text style={styles.statLabel}>Bought</Text>
              <Text style={[styles.statValue, styles.statInText]}>
                {formatAmount(item.in)}
              </Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, styles.statOut]}>
              <Ionicons name="arrow-down" size={12} color="#EF4444" />
            </View>
            <View>
              <Text style={styles.statLabel}>Sold</Text>
              <Text style={[styles.statValue, styles.statOutText]}>
                {formatAmount(item.out)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons
              name="swap-horizontal-outline"
              size={14}
              color="#6B7280"
            />
            <Text style={styles.footerLabel}>Rate</Text>
            <Text style={styles.footerValue}>
              {item.rate?.toFixed(4) || "1.0000"}
            </Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Ionicons name="cash-outline" size={14} color="#6B7280" />
            <Text style={styles.footerLabel}>RM</Text>
            <Text style={styles.footerValue}>
              {formatAmount(item.closingBalance * (item.rate / 100))}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  if (permissionLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  if (!access.DailyBalance) {
    return (
      <AccessDeniedView message="You don't have permission to view this report." />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [
            styles.dateSelector,
            pressed && styles.dateSelectorPressed,
          ]}
        >
          <Ionicons name="calendar-outline" size={22} color={BRAND_COLOR} />
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {!loading && !errorMessage && items.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Balance</Text>
            <Text
              style={[
                styles.summaryValue,
                totalBalance >= 0 ? styles.summaryIn : styles.summaryOut,
              ]}
            >
              RM {formatAmount(totalBalance)}
            </Text>
          </View>
        </View>
      )}

      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={showPicker} transparent animationType="slide">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onValueChange={handleValueChange}
              />
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
            onPress={() => loadReport(date)}
            style={styles.retryButton}
          >
            <Ionicons name="refresh-outline" size={18} color={BRAND_COLOR} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.currency}
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
              <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No data available</Text>
              <Text style={styles.emptySubtext}>for this date</Text>
            </View>
          }
          renderItem={renderCurrencyItem}
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
  dateSelector: {
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
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  // 汇总卡片
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
  },
  summaryIn: {
    color: "#22C55E",
  },
  summaryOut: {
    color: "#EF4444",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: "#FAFBFC",
  },
  currencyBadge: {
    backgroundColor: `${BRAND_COLOR}15`,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  cardBody: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statIn: {
    backgroundColor: "#22C55E15",
  },
  statOut: {
    backgroundColor: "#EF444415",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  statInText: {
    color: "#22C55E",
  },
  statOutText: {
    color: "#EF4444",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#F3F4F6",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  footerValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#F3F4F6",
  },
  adjustmentPositive: {
    color: "#F59E0B",
  },
});
