import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart, PieChart } from "react-native-gifted-charts";

import { Spacing } from "@/constants/theme";
import {
  type BalanceChartItem,
  type DashboardData,
  fetchDashboard,
} from "@/services/dashboard-api";

const BRAND_COLOR = "#208AEF";
const SUCCESS_COLOR = "#22C55E";
const ERROR_COLOR = "#EF4444";
const OTHER_COLOR = "#9CA3AF";

// Fixed, colorblind-safe categorical order — never cycled. Currencies beyond
// this count (or an explicit "Other" bucket from the API) fold into the
// neutral OTHER_COLOR rather than generating/reusing a hue.
const CATEGORICAL_PALETTE = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#4a3aa7",
  "#e34948",
];

function assignCurrencyColors(labels: string[]): Record<string, string> {
  const assignments: Record<string, string> = {};
  const distinctCodes = Array.from(
    new Set(
      labels
        .map((label) => label.trim().toUpperCase())
        .filter((code) => code && code !== "OTHER"),
    ),
  ).sort();

  distinctCodes.forEach((code, index) => {
    assignments[code] =
      index < CATEGORICAL_PALETTE.length
        ? CATEGORICAL_PALETTE[index]
        : OTHER_COLOR;
  });

  return assignments;
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

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function formatMonthLabel(monthValue: string): string {
  const [year, month] = monthValue.split("-").map(Number);
  if (!year || !month) return monthValue;
  const date = new Date(year, month - 1, 1);
  const monthShort = date.toLocaleDateString("en-GB", { month: "short" });
  return `${monthShort} '${String(year).slice(2)}`;
}

function balancePercent(item: BalanceChartItem, total: number): string {
  if (total <= 0) return "0.0%";
  return `${((Math.max(item.value, 0) / total) * 100).toFixed(1)}%`;
}

export function DashboardScreen() {
  const [date, setDate] = useState(new Date());
  const [appliedDate, setAppliedDate] = useState(date);
  const [showPicker, setShowPicker] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedCurrencyIndex, setSelectedCurrencyIndex] = useState<
    number | null
  >(null);
  const [lineChartWidth, setLineChartWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async (forDate: Date) => {
    setErrorMessage(null);
    try {
      const data = await fetchDashboard(forDate);
      setDashboard(data);
      setSelectedCurrencyIndex(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load dashboard",
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadDashboard(appliedDate);
      setLoading(false);
    })();
  }, [appliedDate, loadDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard(appliedDate);
    setRefreshing(false);
  }, [appliedDate, loadDashboard]);

  function applyFilters() {
    setAppliedDate(date);
  }

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

  const balanceChart = useMemo(
    () => dashboard?.balanceChart ?? [],
    [dashboard],
  );
  const balanceTotal = balanceChart.reduce(
    (sum, item) => sum + Math.max(item.value, 0),
    0,
  );
  const currencyColors = useMemo(
    () => assignCurrencyColors(balanceChart.map((item) => item.label)),
    [balanceChart],
  );
  const donutData = balanceChart.map((item) => {
    const code = item.label.trim().toUpperCase();
    return {
      label: item.label.trim(),
      value: item.value,
      color:
        code === "OTHER" ? OTHER_COLOR : (currencyColors[code] ?? OTHER_COLOR),
    };
  });

  const centerLabel =
    selectedCurrencyIndex !== null && donutData[selectedCurrencyIndex]
      ? donutData[selectedCurrencyIndex].label
      : "Currencies";
  const centerValue =
    selectedCurrencyIndex !== null && donutData[selectedCurrencyIndex]
      ? formatAmount(donutData[selectedCurrencyIndex].value)
      : String(donutData.length);

  const grossProfit = dashboard?.totalGrossProfit ?? 0;

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
          <Ionicons name="calendar-outline" size={20} color={BRAND_COLOR} />
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </Pressable>

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
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            onPress={() => loadDashboard(appliedDate)}
            style={styles.retryButton}
          >
            <Ionicons name="refresh-outline" size={18} color={BRAND_COLOR} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={BRAND_COLOR}
              colors={[BRAND_COLOR]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statGrid}>
            <View style={styles.statTile}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${BRAND_COLOR}15` },
                ]}
              >
                <Ionicons name="people-outline" size={18} color={BRAND_COLOR} />
              </View>
              <Text style={styles.statLabel}>New Customers</Text>
              <Text style={styles.statValue}>
                {formatCount(dashboard?.newCustomerCount ?? 0)}
              </Text>
            </View>

            <View style={styles.statTile}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${BRAND_COLOR}15` },
                ]}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color={BRAND_COLOR}
                />
              </View>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>
                {formatCount(dashboard?.transactionCount ?? 0)}
              </Text>
            </View>

            <View style={styles.statTile}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${SUCCESS_COLOR}15` },
                ]}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={18}
                  color={SUCCESS_COLOR}
                />
              </View>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={styles.statValue}>
                RM {formatAmount(dashboard?.totalSalesRM ?? 0)}
              </Text>
            </View>

            <View style={styles.statTile}>
              <View
                style={[
                  styles.statIcon,
                  { backgroundColor: `${BRAND_COLOR}15` },
                ]}
              >
                <Ionicons name="cart-outline" size={18} color={BRAND_COLOR} />
              </View>
              <Text style={styles.statLabel}>Total Buy</Text>
              <Text style={styles.statValue}>
                RM {formatAmount(dashboard?.totalBuyRM ?? 0)}
              </Text>
            </View>

            <View style={[styles.statTile, styles.statTileWide]}>
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor:
                      grossProfit >= 0
                        ? `${SUCCESS_COLOR}15`
                        : `${ERROR_COLOR}15`,
                  },
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={grossProfit >= 0 ? SUCCESS_COLOR : ERROR_COLOR}
                />
              </View>
              <Text style={styles.statLabel}>Gross Profit</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: grossProfit >= 0 ? SUCCESS_COLOR : ERROR_COLOR },
                ]}
              >
                RM {formatAmount(grossProfit)}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Balance by Currency</Text>
            {donutData.length === 0 ? (
              <View style={styles.emptyChart}>
                <Ionicons name="pie-chart-outline" size={36} color="#D1D5DB" />
                <Text style={styles.emptyText}>No balance data</Text>
              </View>
            ) : (
              <View style={styles.donutRow}>
                <PieChart
                  data={donutData.map((item) => ({
                    value: Math.max(item.value, 0),
                    color: item.color,
                  }))}
                  donut
                  radius={78}
                  innerRadius={50}
                  innerCircleColor="#FFFFFF"
                  focusOnPress
                  toggleFocusOnPress
                  selectedIndex={selectedCurrencyIndex ?? -1}
                  setSelectedIndex={(index: number) =>
                    setSelectedCurrencyIndex(index === -1 ? null : index)
                  }
                  centerLabelComponent={() => (
                    <View style={styles.pieCenterContent}>
                      <Text style={styles.pieCenterLabel} numberOfLines={1}>
                        {centerLabel}
                      </Text>
                      <Text
                        style={styles.pieCenterValue}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {centerValue}
                      </Text>
                    </View>
                  )}
                />
                <View style={styles.legend}>
                  {donutData.map((item, index) => {
                    const isSelected = selectedCurrencyIndex === index;
                    return (
                      <Pressable
                        key={item.label}
                        onPress={() =>
                          setSelectedCurrencyIndex(isSelected ? null : index)
                        }
                        style={[
                          styles.legendRow,
                          isSelected && styles.legendRowSelected,
                        ]}
                      >
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <View style={styles.legendTextGroup}>
                          <Text style={styles.legendLabel} numberOfLines={1}>
                            {item.label}
                          </Text>
                          <Text style={styles.legendValue} numberOfLines={1}>
                            {formatAmount(item.value)}
                          </Text>
                        </View>
                        <Text style={styles.legendPercent}>
                          {balancePercent(balanceChart[index], balanceTotal)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Profit</Text>
            {(dashboard?.monthlyProfitChart.length ?? 0) === 0 ? (
              <View style={styles.emptyChart}>
                <Ionicons
                  name="stats-chart-outline"
                  size={36}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyText}>No profit data</Text>
              </View>
            ) : (
              <View
                onLayout={(e) =>
                  setLineChartWidth(e.nativeEvent.layout.width * 0.92)
                }
              >
                {lineChartWidth > 0 && (
                  <LineChart
                    data={(dashboard?.monthlyProfitChart ?? []).map((item) => ({
                      value: item.profit,
                      label: formatMonthLabel(item.month),
                    }))}
                    height={180}
                    adjustToWidth
                    parentWidth={lineChartWidth}
                    color={BRAND_COLOR}
                    thickness={2}
                    areaChart
                    startFillColor={BRAND_COLOR}
                    endFillColor={BRAND_COLOR}
                    startOpacity={0.15}
                    endOpacity={0.02}
                    dataPointsColor={BRAND_COLOR}
                    dataPointsRadius={4}
                    yAxisTextStyle={styles.chartAxisText}
                    xAxisLabelTextStyle={styles.chartAxisText}
                    yAxisLabelWidth={50}
                    formatYLabel={(label) =>
                      Math.round(Number(label)).toLocaleString("en-US")
                    }
                    rulesType="solid"
                    rulesColor="#F3F4F6"
                    xAxisColor="#E5E7EB"
                    yAxisColor="#E5E7EB"
                    noOfSections={4}
                    isAnimated
                    pointerConfig={{
                      pointerStripHeight: 140,
                      pointerStripColor: "#E5E7EB",
                      pointerStripWidth: 1,
                      pointerColor: BRAND_COLOR,
                      radius: 6,
                      activatePointersInstantlyOnTouch: true,
                      autoAdjustPointerLabelPosition: true,
                      pointerLabelWidth: 110,
                      pointerLabelHeight: 40,
                      pointerLabelComponent: (
                        items: { value: number; label: string }[],
                      ) => (
                        <View style={styles.tooltip}>
                          <Text style={styles.tooltipValue}>
                            RM {formatAmount(items[0].value)}
                          </Text>
                          <Text style={styles.tooltipLabel}>
                            {items[0].label}
                          </Text>
                        </View>
                      ),
                    }}
                  />
                )}
              </View>
            )}
          </View>
        </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: Spacing.two,
  },
  dateSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateSelectorPressed: {
    opacity: 0.7,
  },
  dateText: {
    flex: 1,
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
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
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  statTile: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.three,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statTileWide: {
    flexBasis: "100%",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: Spacing.three,
  },
  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  pieCenterContent: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pieCenterLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  pieCenterValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  chartAxisText: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  tooltip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  tooltipLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  legendRowSelected: {
    backgroundColor: "#F9FAFB",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextGroup: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  legendValue: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  legendPercent: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  emptyChart: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
});
