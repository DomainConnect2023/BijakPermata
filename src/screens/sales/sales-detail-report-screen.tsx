import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
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
import { AmountRangeInputs } from "@/components/amount-range-inputs";
import { CollapsibleFilterSection } from "@/components/collapsible-filter-section";
import { Spacing } from "@/constants/theme";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  type PurchaseSalesGroup,
  fetchPurchaseSales,
  formatDateParam,
  parseDateParam,
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

function parseAmountLow(text: string): number {
  const value = Number(text.trim());
  return text.trim() !== "" && Number.isFinite(value) ? value : 0;
}

function parseAmountHigh(text: string): number {
  const value = Number(text.trim());
  return text.trim() !== "" && Number.isFinite(value) ? value : Infinity;
}

type ActivePicker = "from" | "to" | null;

type Props = {
  initialFromDate?: string;
  initialToDate?: string;
};

export function SalesDetailReportScreen({
  initialFromDate,
  initialToDate,
}: Props) {
  const router = useRouter();
  const { loading: permissionLoading, access } = usePageAccess(["SalesDetail"]);

  const [fromDate, setFromDate] = useState(() =>
    initialFromDate ? parseDateParam(initialFromDate) : startOfDay(new Date()),
  );
  const [toDate, setToDate] = useState(() =>
    initialToDate ? parseDateParam(initialToDate) : startOfDay(new Date()),
  );
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate,
    toDate,
    amountLow: 0,
    amountHigh: Infinity,
  });

  const [groups, setGroups] = useState<PurchaseSalesGroup[]>([]);
  // Draft amount inputs the user is editing; only take effect once committed
  // into appliedFilters via the Search button, same as dates.
  const [amountLowText, setAmountLowText] = useState("");
  const [amountHighText, setAmountHighText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReport = useCallback(async (from: Date, to: Date) => {
    setErrorMessage(null);
    try {
      const data = await fetchPurchaseSales(from, to, "S");
      const filtered = data.filter(
        (group) => group.currency && group.currency !== "0",
      );
      setGroups(filtered);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load report",
      );
    }
  }, []);

  useEffect(() => {
    if (permissionLoading || !access.SalesDetail) return;
    (async () => {
      setLoading(true);
      await loadReport(appliedFilters.fromDate, appliedFilters.toDate);
      setLoading(false);
    })();
  }, [appliedFilters, loadReport, permissionLoading, access.SalesDetail]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport(appliedFilters.fromDate, appliedFilters.toDate);
    setRefreshing(false);
  }, [appliedFilters, loadReport]);

  function applyFilters() {
    setAppliedFilters({
      fromDate,
      toDate,
      amountLow: parseAmountLow(amountLowText),
      amountHigh: parseAmountHigh(amountHighText),
    });
    setFiltersExpanded(false);
  }

  // Clear the amount filter every time this screen is entered/refocused, so
  // a filter picked on a previous visit doesn't silently carry over.
  useFocusEffect(
    useCallback(() => {
      setAmountLowText("");
      setAmountHighText("");
      setAppliedFilters((prev) => ({
        ...prev,
        amountLow: 0,
        amountHigh: Infinity,
      }));
    }, []),
  );

  const incomingRangeKey =
    initialFromDate && initialToDate
      ? `${initialFromDate}|${initialToDate}`
      : undefined;
  const [appliedRangeKey, setAppliedRangeKey] = useState(incomingRangeKey);
  if (incomingRangeKey && incomingRangeKey !== appliedRangeKey) {
    setAppliedRangeKey(incomingRangeKey);
    const from = parseDateParam(initialFromDate!);
    const to = parseDateParam(initialToDate!);
    setFromDate(from);
    setToDate(to);
    setAmountLowText("");
    setAmountHighText("");
    setAppliedFilters({
      fromDate: from,
      toDate: to,
      amountLow: 0,
      amountHigh: Infinity,
    });
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

  function openCurrency(group: PurchaseSalesGroup) {
    router.push({
      pathname: "/sales-detail-transactions",
      params: {
        currency: group.currency,
        fromDate: formatDateParam(appliedFilters.fromDate),
        toDate: formatDateParam(appliedFilters.toDate),
      },
    });
  }

  const visibleGroups = groups.filter(
    (group) =>
      group.totalFCAmountRM >= appliedFilters.amountLow &&
      group.totalFCAmountRM <= appliedFilters.amountHigh,
  );

  const totalTransactions = visibleGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const totalRM = visibleGroups.reduce(
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

  if (!access.SalesDetail) {
    return (
      <AccessDeniedView message="You don't have permission to view this report." />
    );
  }

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

          <View style={styles.amountFilterSection}>
            <Text style={styles.amountFilterLabel}>Amount Range (RM)</Text>
            <AmountRangeInputs
              lowText={amountLowText}
              highText={amountHighText}
              onLowChange={setAmountLowText}
              onHighChange={setAmountHighText}
              activeColor={BRAND_COLOR}
            />
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

      {!loading && !errorMessage && groups.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{totalTransactions}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total RM (Amount)</Text>
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
          data={visibleGroups}
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
              <Ionicons name="trending-up-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No sales found</Text>
              <Text style={styles.emptySubtext}>
                {groups.length > 0
                  ? "for this amount range"
                  : "for this date range"}
              </Text>
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
                <Text style={styles.currencyRM}>
                  ≈ RM {formatAmount(group.totalFCAmountRM)}
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
  amountFilterSection: {
    gap: Spacing.two,
  },
  amountFilterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountFilterLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  amountFilterValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
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
  currencyRM: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLOR,
    marginTop: 2,
  },
  currencySubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});
