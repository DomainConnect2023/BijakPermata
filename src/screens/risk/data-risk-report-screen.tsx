import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useState } from "react";
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

import { CollapsibleFilterSection } from "@/components/collapsible-filter-section";
import { Spacing } from "@/constants/theme";
import {
  type DataRiskItem,
  type DataRiskType,
  fetchDataRisk,
  parseDateParam,
} from "@/services/report-api";

const BRAND_COLOR = "#208AEF";

const RISK_TYPES: { key: DataRiskType; label: string; color: string }[] = [
  { key: "LOW", label: "Low Risk", color: "#22C55E" },
  { key: "MED", label: "Medium Risk", color: "#F59E0B" },
  { key: "AVE", label: "Average Risk", color: "#3B82F6" },
  { key: "HIGH", label: "High Risk", color: "#EF4444" },
];

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

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

type ActivePicker = "from" | "to" | null;

type Props = {
  initialFromDate?: string;
  initialToDate?: string;
};

export function DataRiskReportScreen({
  initialFromDate,
  initialToDate,
}: Props) {
  const [fromDate, setFromDate] = useState(() =>
    initialFromDate ? parseDateParam(initialFromDate) : daysAgo(30),
  );
  const [toDate, setToDate] = useState(() =>
    initialToDate ? parseDateParam(initialToDate) : startOfDay(new Date()),
  );
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [appliedFilters, setAppliedFilters] = useState({ fromDate, toDate });

  const [items, setItems] = useState<DataRiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReport = useCallback(async (from: Date, to: Date) => {
    setErrorMessage(null);
    try {
      const data = await fetchDataRisk(from, to);
      setItems(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load report",
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadReport(appliedFilters.fromDate, appliedFilters.toDate);
      setLoading(false);
    })();
  }, [appliedFilters, loadReport]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport(appliedFilters.fromDate, appliedFilters.toDate);
    setRefreshing(false);
  }, [appliedFilters, loadReport]);

  function applyFilters() {
    setAppliedFilters({ fromDate, toDate });
    setFiltersExpanded(false);
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

  // Always show all four risk buckets, defaulting missing ones to zero —
  // the API only returns entries that have data for the selected range.
  const breakdown = RISK_TYPES.map((meta) => {
    const found = items.find((item) => item.riskType === meta.key);
    return { ...meta, total: found?.total ?? 0 };
  });
  const grandTotal = breakdown.reduce((sum, item) => sum + item.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <CollapsibleFilterSection
          expanded={filtersExpanded}
          onToggle={() => setFiltersExpanded((prev) => !prev)}
          summary={`${formatDisplayDate(appliedFilters.fromDate)} – ${formatDisplayDate(appliedFilters.toDate)}`}
          activeColor={BRAND_COLOR}
        >
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
        </CollapsibleFilterSection>
      </View>

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
        <ScrollView
          contentContainerStyle={styles.listContent}
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
          <View style={styles.riskCard}>
            {breakdown.map((item) => {
              const percent =
                grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
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
              <Text style={styles.totalValue}>{formatCount(grandTotal)}</Text>
            </View>
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
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  riskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.four,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  riskRow: {
    marginBottom: Spacing.four,
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
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
});
