import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  type MarginProfitItem,
  fetchMarginProfit,
} from "@/services/report-api";

const BRAND_COLOR = "#208AEF";

// Fixed categorical order (never cycled) so a currency's color stays tied to
// its rank; overflow currencies fold into a neutral "Other" bucket rather
// than generating a fourth hue.
const BREAKDOWN_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];
const BREAKDOWN_OTHER_COLOR = "#C3C2B7";

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function daysAgo(days: number): Date {
  const result = startOfDay(new Date());
  result.setDate(result.getDate() - days);
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

export function MarginReportScreen() {
  const { loading: permissionLoading, access } = usePageAccess([
    "MarginReport",
  ]);

  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(startOfDay(new Date()));
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const [appliedFilters, setAppliedFilters] = useState({ fromDate, toDate });

  const [items, setItems] = useState<MarginProfitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedCurrencies, setExpandedCurrencies] = useState<Set<string>>(
    new Set(),
  );

  function toggleExpand(currency: string) {
    setExpandedCurrencies((prev) => {
      const next = new Set(prev);
      if (next.has(currency)) {
        next.delete(currency);
      } else {
        next.add(currency);
      }
      return next;
    });
  }

  const loadReport = useCallback(async (from: Date, to: Date) => {
    setErrorMessage(null);
    try {
      const data = await fetchMarginProfit(from, to);
      setItems(data.filter((item) => item.currency && item.currency !== "0"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load report",
      );
    }
  }, []);

  useEffect(() => {
    if (permissionLoading || !access.MarginReport) return;
    (async () => {
      setLoading(true);
      await loadReport(appliedFilters.fromDate, appliedFilters.toDate);
      setLoading(false);
    })();
  }, [appliedFilters, loadReport, permissionLoading, access.MarginReport]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport(appliedFilters.fromDate, appliedFilters.toDate);
    setRefreshing(false);
  }, [appliedFilters, loadReport]);

  function applyFilters() {
    setAppliedFilters({ fromDate, toDate });
  }

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

  const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);

  const breakdown = useMemo(() => {
    const profitable = items
      .filter((item) => item.profit > 0)
      .sort((a, b) => b.profit - a.profit);
    const top = profitable.slice(0, 3);
    const otherTotal = profitable
      .slice(3)
      .reduce((sum, item) => sum + item.profit, 0);
    const total = profitable.reduce((sum, item) => sum + item.profit, 0);
    return { top, otherTotal, total };
  }, [items]);

  function renderStatBlock(
    label: string,
    amount: number,
    amountRM: number,
    currencyCode: string,
  ) {
    return (
      <View style={styles.statBlock}>
        <Text style={styles.statBlockLabel}>{label}</Text>
        <Text style={styles.statBlockAmount}>
          {currencyCode} {formatAmount(amount)}
        </Text>
        <Text style={styles.statBlockAmountRM}>
          RM {formatAmount(amountRM)}
        </Text>
      </View>
    );
  }

  const renderMarginItem = ({ item }: { item: MarginProfitItem }) => {
    const expanded = expandedCurrencies.has(item.currency);
    const percentOfTotal =
      totalProfit !== 0 ? (item.profit / totalProfit) * 100 : 0;

    return (
      <Pressable
        onPress={() => toggleExpand(item.currency)}
        style={styles.currencyCard}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeText}>{item.currency}</Text>
          </View>
          <View style={styles.headerTextWrapper}>
            <Text
              style={[
                styles.headerAmount,
                item.profit < 0 && styles.profitNegative,
              ]}
            >
              RM {formatAmount(item.profit)}
            </Text>
            <Text style={styles.headerPercent}>
              {percentOfTotal.toFixed(1)}% of Total
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#9CA3AF"
          />
        </View>

        {expanded && (
          <>
            <View style={styles.divider} />
            <View style={styles.statsGrid}>
              {renderStatBlock("Opening Stock", item.ob, item.obrm, item.currency)}
              {renderStatBlock("Purchase", item.buy, item.buyRM, item.currency)}
              {renderStatBlock("Sales", item.sale, item.saleRM, item.currency)}
              {renderStatBlock(
                "Balance",
                item.balance,
                item.balanceRM,
                item.currency,
              )}
            </View>
          </>
        )}
      </Pressable>
    );
  };

  if (permissionLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  if (!access.MarginReport) {
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
              <Text style={styles.dateText}>
                {formatDisplayDate(fromDate)}
              </Text>
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

        <Pressable
          onPress={applyFilters}
          style={({ pressed }) => [
            styles.searchButton,
            pressed && styles.searchButtonPressed,
          ]}
        >
          <Ionicons name="search" size={16} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      {!loading && !errorMessage && items.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Profit</Text>
            <Text
              style={[
                styles.summaryValue,
                totalProfit >= 0 ? styles.summaryIn : styles.summaryOut,
              ]}
            >
              RM {formatAmount(totalProfit)}
            </Text>
          </View>
        </View>
      )}

      {!loading && !errorMessage && breakdown.total > 0 && (
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Top Currencies by Profit</Text>
          <View style={styles.breakdownBar}>
            {breakdown.top.map((item, index) => (
              <View
                key={item.currency}
                style={[
                  styles.breakdownSegment,
                  {
                    flex: item.profit,
                    backgroundColor: BREAKDOWN_COLORS[index],
                  },
                ]}
              />
            ))}
            {breakdown.otherTotal > 0 && (
              <View
                style={[
                  styles.breakdownSegment,
                  styles.breakdownSegmentLast,
                  {
                    flex: breakdown.otherTotal,
                    backgroundColor: BREAKDOWN_OTHER_COLOR,
                  },
                ]}
              />
            )}
          </View>
          <View style={styles.legendRow}>
            {breakdown.top.map((item, index) => (
              <View key={item.currency} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: BREAKDOWN_COLORS[index] },
                  ]}
                />
                <Text style={styles.legendLabel}>{item.currency}</Text>
                <Text style={styles.legendPercent}>
                  {((item.profit / breakdown.total) * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
            {breakdown.otherTotal > 0 && (
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: BREAKDOWN_OTHER_COLOR },
                  ]}
                />
                <Text style={styles.legendLabel}>Other</Text>
                <Text style={styles.legendPercent}>
                  {((breakdown.otherTotal / breakdown.total) * 100).toFixed(1)}
                  %
                </Text>
              </View>
            )}
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
            onPress={() =>
              loadReport(appliedFilters.fromDate, appliedFilters.toDate)
            }
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
              <Ionicons name="analytics-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No data available</Text>
              <Text style={styles.emptySubtext}>for this date range</Text>
            </View>
          }
          renderItem={renderMarginItem}
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
    gap: Spacing.two,
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
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    backgroundColor: BRAND_COLOR,
    paddingVertical: Spacing.two + 4,
    borderRadius: 12,
  },
  searchButtonPressed: {
    opacity: 0.85,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
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
    fontSize: 18,
    fontWeight: "700",
  },
  summaryIn: {
    color: "#22C55E",
  },
  summaryOut: {
    color: "#EF4444",
  },
  breakdownCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: Spacing.two,
  },
  breakdownBar: {
    flexDirection: "row",
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  breakdownSegment: {
    marginRight: 2,
  },
  breakdownSegmentLast: {
    marginRight: 0,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  legendPercent: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
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
    padding: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
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
  headerTextWrapper: {
    flex: 1,
  },
  headerAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerPercent: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6366F1",
    marginTop: 2,
  },
  profitNegative: {
    color: "#EF4444",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: Spacing.three,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statBlock: {
    width: "50%",
    marginBottom: Spacing.three,
    gap: 2,
  },
  statBlockLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  statBlockAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0D9488",
  },
  statBlockAmountRM: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D97706",
  },
});
