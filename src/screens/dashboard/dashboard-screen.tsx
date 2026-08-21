import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
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
  fetchDashboardByMonth,
  fetchDashboardByYear,
} from "@/services/dashboard-api";
import { type DataRiskType, formatDateParam } from "@/services/report-api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND_COLOR = "#208AEF";
const SUCCESS_COLOR = "#22C55E";
const ERROR_COLOR = "#EF4444";
const OTHER_COLOR = "#9CA3AF";

type DashboardTab = "daily" | "monthly" | "yearly";

const TAB_OPTIONS: { value: DashboardTab; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

const RISK_TYPES: { key: DataRiskType; label: string; color: string }[] = [
  { key: "LOW", label: "Low Risk", color: "#22C55E" },
  { key: "MED", label: "Medium Risk", color: "#F59E0B" },
  { key: "AVE", label: "Average Risk", color: "#3B82F6" },
  { key: "HIGH", label: "High Risk", color: "#EF4444" },
];

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonthYearDisplay(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function isCurrentOrFutureMonth(year: number, month: number): boolean {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  return year > nowYear || (year === nowYear && month >= nowMonth);
}

function getMonthRange(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(year, month - 1, 1),
    to: new Date(year, month, 0), // day 0 of next month = last day of this one
  };
}

function getYearRange(year: number): { from: Date; to: Date } {
  return { from: new Date(year, 0, 1), to: new Date(year, 11, 31) };
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

// profitChart label formats differ per tab: "YYYY-MM-DD" for daily,
// "YYYY-MM" for monthly, and a bare "YYYY" for yearly (used as-is).
function formatDayLabel(dateValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return dateValue;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatMonthTrendLabel(monthValue: string): string {
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

type StatTileProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBackground: string;
  label: string;
  value: string;
  valueColor?: string;
  wide?: boolean;
  onPress?: () => void;
};

function StatTile({
  icon,
  iconColor,
  iconBackground,
  label,
  value,
  valueColor,
  wide,
  onPress,
}: StatTileProps) {
  const content = (
    <>
      <View style={styles.statTileHeader}>
        <View style={[styles.statIcon, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        )}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[styles.statValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.statTile, wide && styles.statTileWide]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statTile,
        wide && styles.statTileWide,
        pressed && styles.statTilePressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("daily");

  const [dailyDate, setDailyDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [monthPickerYear, setMonthPickerYear] = useState(monthYear.year);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedCurrencyIndex, setSelectedCurrencyIndex] = useState<
    number | null
  >(null);
  const [lineChartWidth, setLineChartWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (
      tab: DashboardTab,
      filters: {
        dailyDate: Date;
        monthYear: { year: number; month: number };
        year: number;
      },
    ) => {
      setErrorMessage(null);
      try {
        const data =
          tab === "daily"
            ? await fetchDashboard(filters.dailyDate)
            : tab === "monthly"
              ? await fetchDashboardByMonth(
                  filters.monthYear.year,
                  filters.monthYear.month,
                )
              : await fetchDashboardByYear(filters.year);
        setDashboard(data);
        setSelectedCurrencyIndex(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load dashboard",
        );
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadDashboard(activeTab, { dailyDate, monthYear, year });
      setLoading(false);
    })();
  }, [activeTab, dailyDate, monthYear, year, loadDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard(activeTab, { dailyDate, monthYear, year });
    setRefreshing(false);
  }, [activeTab, dailyDate, monthYear, year, loadDashboard]);

  function getDrillDownRange(): { from: Date; to: Date } {
    if (activeTab === "monthly")
      return getMonthRange(monthYear.year, monthYear.month);
    if (activeTab === "yearly") return getYearRange(year);
    return { from: dailyDate, to: dailyDate };
  }

  function goToTransactions() {
    const { from, to } = getDrillDownRange();
    router.push({
      pathname: "/transaction",
      params: { fromDate: formatDateParam(from), toDate: formatDateParam(to) },
    });
  }

  function goToSales() {
    const { from, to } = getDrillDownRange();
    router.push({
      pathname: "/sales/sales-detail-report",
      params: { fromDate: formatDateParam(from), toDate: formatDateParam(to) },
    });
  }

  function goToPurchasing() {
    const { from, to } = getDrillDownRange();
    router.push({
      pathname: "/purchasing/purchase-detail-report",
      params: { fromDate: formatDateParam(from), toDate: formatDateParam(to) },
    });
  }

  function goToMargin() {
    const { from, to } = getDrillDownRange();
    router.push({
      pathname: "/margin",
      params: { fromDate: formatDateParam(from), toDate: formatDateParam(to) },
    });
  }

  function goToDataRisk() {
    const { from, to } = getDrillDownRange();
    router.push({
      pathname: "/risk",
      params: { fromDate: formatDateParam(from), toDate: formatDateParam(to) },
    });
  }

  function handleValueChange(
    _event: DateTimePickerChangeEvent,
    selected: Date,
  ) {
    setDailyDate(selected);
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  }

  function handleDismiss() {
    setShowDatePicker(false);
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 21 }, (_, index) => currentYear - index),
    [currentYear],
  );

  function openMonthPicker() {
    setMonthPickerYear(monthYear.year);
    setMonthPickerVisible(true);
  }

  function selectMonth(month: number) {
    setMonthYear({ year: monthPickerYear, month });
    setMonthPickerVisible(false);
  }

  function selectYear(selected: number) {
    setYear(selected);
    setYearPickerVisible(false);
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
  const formatTrendLabel =
    activeTab === "daily"
      ? formatDayLabel
      : activeTab === "monthly"
        ? formatMonthTrendLabel
        : (label: string) => label;

  // Always show all four risk buckets, defaulting missing ones to zero —
  // the API only returns entries that have data for the selected range.
  const dataRiskChart = dashboard?.dataRiskChart ?? [];
  const riskBreakdown = RISK_TYPES.map((meta) => {
    const found = dataRiskChart.find((item) => item.riskType === meta.key);
    return { ...meta, total: found?.total ?? 0 };
  });
  const riskTotal = riskBreakdown.reduce((sum, item) => sum + item.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.tabRow}>
          {TAB_OPTIONS.map((option) => {
            const active = activeTab === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setActiveTab(option.value)}
                style={[styles.tabOption, active && styles.tabOptionActive]}
              >
                <Text
                  style={[
                    styles.tabOptionText,
                    active && styles.tabOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "daily" && (
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [
              styles.dateSelector,
              pressed && styles.dateSelectorPressed,
            ]}
          >
            <Ionicons name="calendar-outline" size={20} color={BRAND_COLOR} />
            <Text style={styles.dateText}>{formatDisplayDate(dailyDate)}</Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </Pressable>
        )}

        {activeTab === "monthly" && (
          <Pressable
            onPress={openMonthPicker}
            style={({ pressed }) => [
              styles.dateSelector,
              pressed && styles.dateSelectorPressed,
            ]}
          >
            <Ionicons name="calendar-outline" size={20} color={BRAND_COLOR} />
            <Text style={styles.dateText}>
              {formatMonthYearDisplay(monthYear.year, monthYear.month)}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </Pressable>
        )}

        {activeTab === "yearly" && (
          <Pressable
            onPress={() => setYearPickerVisible(true)}
            style={({ pressed }) => [
              styles.dateSelector,
              pressed && styles.dateSelectorPressed,
            ]}
          >
            <Ionicons name="calendar-outline" size={20} color={BRAND_COLOR} />
            <Text style={styles.dateText}>{year}</Text>
            <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={dailyDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dailyDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onValueChange={handleValueChange}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      <Modal
        visible={monthPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMonthPickerVisible(false)}
        >
          <Pressable
            style={[styles.modalCard, { paddingBottom: insets.bottom }]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <Pressable onPress={() => setMonthPickerVisible(false)}>
                <Text style={styles.modalDone}>Close</Text>
              </Pressable>
            </View>
            <View style={styles.yearStepperRow}>
              <Pressable
                onPress={() => setMonthPickerYear((prev) => prev - 1)}
                style={styles.stepperButton}
              >
                <Ionicons name="chevron-back" size={20} color={BRAND_COLOR} />
              </Pressable>
              <Text style={styles.yearStepperValue}>{monthPickerYear}</Text>
              <Pressable
                onPress={() =>
                  setMonthPickerYear((prev) => Math.min(prev + 1, currentYear))
                }
                disabled={monthPickerYear >= currentYear}
                style={[
                  styles.stepperButton,
                  monthPickerYear >= currentYear &&
                    styles.stepperButtonDisabled,
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    monthPickerYear >= currentYear ? "#D1D5DB" : BRAND_COLOR
                  }
                />
              </Pressable>
            </View>
            <View style={styles.optionGrid}>
              {MONTH_NAMES.map((name, index) => {
                const monthNum = index + 1;
                const disabled = isCurrentOrFutureMonth(
                  monthPickerYear,
                  monthNum,
                );
                const selected =
                  monthPickerYear === monthYear.year &&
                  monthNum === monthYear.month;
                return (
                  <Pressable
                    key={name}
                    disabled={disabled}
                    onPress={() => selectMonth(monthNum)}
                    style={[
                      styles.optionTile,
                      selected && styles.optionTileSelected,
                      disabled && styles.optionTileDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionTileText,
                        selected && styles.optionTileTextSelected,
                      ]}
                    >
                      {name.slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={yearPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setYearPickerVisible(false)}
        >
          <Pressable
            style={[styles.modalCard, { paddingBottom: insets.bottom }]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <Pressable onPress={() => setYearPickerVisible(false)}>
                <Text style={styles.modalDone}>Close</Text>
              </Pressable>
            </View>
            <View style={styles.optionGrid}>
              {yearOptions.map((option) => {
                const selected = option === year;
                return (
                  <Pressable
                    key={option}
                    onPress={() => selectYear(option)}
                    style={[
                      styles.optionTile,
                      selected && styles.optionTileSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionTileText,
                        selected && styles.optionTileTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
            onPress={() =>
              loadDashboard(activeTab, { dailyDate, monthYear, year })
            }
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
            <StatTile
              icon="people-outline"
              iconColor={BRAND_COLOR}
              iconBackground={`${BRAND_COLOR}15`}
              label="New Customers"
              value={formatCount(dashboard?.newCustomerCount ?? 0)}
            />
            <StatTile
              icon="swap-horizontal-outline"
              iconColor={BRAND_COLOR}
              iconBackground={`${BRAND_COLOR}15`}
              label="Total Transactions"
              value={formatCount(dashboard?.transactionCount ?? 0)}
              onPress={goToTransactions}
            />
            <StatTile
              icon="trending-up-outline"
              iconColor={SUCCESS_COLOR}
              iconBackground={`${SUCCESS_COLOR}15`}
              label="Total Sales"
              value={`RM ${formatAmount(dashboard?.totalSalesRM ?? 0)}`}
              onPress={goToSales}
            />
            <StatTile
              icon="cart-outline"
              iconColor={BRAND_COLOR}
              iconBackground={`${BRAND_COLOR}15`}
              label="Total Buy"
              value={`RM ${formatAmount(dashboard?.totalBuyRM ?? 0)}`}
              onPress={goToPurchasing}
            />
            <StatTile
              wide
              icon="cash-outline"
              iconColor={grossProfit >= 0 ? SUCCESS_COLOR : ERROR_COLOR}
              iconBackground={
                grossProfit >= 0 ? `${SUCCESS_COLOR}15` : `${ERROR_COLOR}15`
              }
              label="Gross Profit"
              value={`RM ${formatAmount(grossProfit)}`}
              valueColor={grossProfit >= 0 ? SUCCESS_COLOR : ERROR_COLOR}
              onPress={goToMargin}
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Balance by Currency</Text>
            {donutData.length === 0 ? (
              <View style={styles.emptyChart}>
                <Ionicons name="pie-chart-outline" size={36} color="#D1D5DB" />
                <Text style={styles.emptyText}>No balance data</Text>
              </View>
            ) : (
              <View style={styles.donutSection}>
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
                  focusedPieIndex={selectedCurrencyIndex ?? -1}
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
                <View style={styles.legendGrid}>
                  {donutData.map((item, index) => {
                    const isSelected = selectedCurrencyIndex === index;
                    return (
                      <Pressable
                        key={item.label}
                        onPress={() =>
                          setSelectedCurrencyIndex(isSelected ? null : index)
                        }
                        style={[
                          styles.legendTile,
                          isSelected && styles.legendRowSelected,
                        ]}
                      >
                        <View style={styles.legendTileHeader}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <Text style={styles.legendLabel} numberOfLines={1}>
                            {item.label}
                          </Text>
                        </View>
                        <Text style={styles.legendValue} numberOfLines={1}>
                          {formatAmount(item.value)}
                        </Text>
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
            <Text style={styles.cardTitle}>Profit Trend</Text>
            {(dashboard?.profitChart.length ?? 0) === 0 ? (
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
                    data={(dashboard?.profitChart ?? []).map((item) => ({
                      value: item.value,
                      label: formatTrendLabel(item.label),
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
                      persistPointer: true,
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

          <Pressable
            onPress={goToDataRisk}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Data Risk</Text>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </View>
            {riskBreakdown.map((item) => {
              const percent =
                riskTotal > 0 ? (item.total / riskTotal) * 100 : 0;
              return (
                <View key={item.key} style={styles.riskRow}>
                  <View style={styles.riskRowHeader}>
                    <View style={styles.riskLabelGroup}>
                      <View
                        style={[styles.riskDot, { backgroundColor: item.color }]}
                      />
                      <Text style={styles.riskLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.riskCount}>
                      {formatCount(item.total)}
                    </Text>
                  </View>
                  <View style={styles.riskBarTrack}>
                    <View
                      style={[
                        styles.riskBarFill,
                        { width: `${percent}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.riskPercent}>{percent.toFixed(1)}%</Text>
                </View>
              );
            })}
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCount(riskTotal)}</Text>
            </View>
          </Pressable>
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: Spacing.two,
  },
  tabRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  tabOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabOptionActive: {
    backgroundColor: BRAND_COLOR,
    borderColor: BRAND_COLOR,
  },
  tabOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabOptionTextActive: {
    color: "#FFFFFF",
  },
  dateSelector: {
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
  stepperButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepperButtonDisabled: {
    opacity: 0.5,
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
  yearStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
    paddingVertical: Spacing.three,
  },
  yearStepperValue: {
    minWidth: 64,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  optionTile: {
    flexBasis: "30%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  optionTileSelected: {
    backgroundColor: BRAND_COLOR,
    borderColor: BRAND_COLOR,
  },
  optionTileDisabled: {
    opacity: 0.4,
  },
  optionTileText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  optionTileTextSelected: {
    color: "#FFFFFF",
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
  statTilePressed: {
    opacity: 0.7,
  },
  statTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riskRow: {
    marginBottom: Spacing.three,
  },
  riskRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.two,
  },
  riskLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  riskCount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  riskBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  riskBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  riskPercent: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },
  totalDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: Spacing.three,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
  donutSection: {
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
  legendGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  legendTile: {
    flexBasis: "30%",
    flexGrow: 1,
    padding: Spacing.two,
    borderRadius: 10,
    gap: 2,
  },
  legendRowSelected: {
    backgroundColor: "#F9FAFB",
  },
  legendTileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  legendValue: {
    fontSize: 11,
    color: "#6B7280",
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
