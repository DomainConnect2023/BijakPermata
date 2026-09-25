import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomActionNav } from "@/components/bottom-action-nav";
import { CollapsibleFilterSection } from "@/components/collapsible-filter-section";
import { Spacing } from "@/constants/theme";
import {
  type ExpensesListingItem,
  type GLCodeItem,
  fetchExpensesGLCodes,
  fetchExpensesListing,
  parseDateParam,
} from "@/services/report-api";

const BRAND_COLOR = "#208AEF";

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

function formatTransactionDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
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

type Props = {
  initialFromDate?: string;
  initialToDate?: string;
};

export function ExpenseListingScreen({
  initialFromDate,
  initialToDate,
}: Props) {
  const insets = useSafeAreaInsets();
  const [fromDate, setFromDate] = useState(() =>
    initialFromDate ? parseDateParam(initialFromDate) : daysAgo(30),
  );
  const [toDate, setToDate] = useState(() =>
    initialToDate ? parseDateParam(initialToDate) : startOfDay(new Date()),
  );
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [glCodes, setGLCodes] = useState<GLCodeItem[]>([]);
  const [selectedGLCode, setSelectedGLCode] = useState<string | null>(null);
  const [glCodeModalVisible, setGLCodeModalVisible] = useState(false);
  const [glCodeSearch, setGLCodeSearch] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate,
    toDate,
    glCode: selectedGLCode,
  });
  const [items, setItems] = useState<ExpensesListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchExpensesGLCodes();
        setGLCodes(list);
      } catch {
        // GL code filter is optional; ignore load failure.
      }
    })();
  }, []);

  const loadReport = useCallback(
    async (from: Date, to: Date, glCode: string | null) => {
      setErrorMessage(null);
      try {
        const data = await fetchExpensesListing(from, to, glCode);
        setItems(data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load report",
        );
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadReport(
        appliedFilters.fromDate,
        appliedFilters.toDate,
        appliedFilters.glCode,
      );
      setLoading(false);
    })();
  }, [appliedFilters, loadReport]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport(
      appliedFilters.fromDate,
      appliedFilters.toDate,
      appliedFilters.glCode,
    );
    setRefreshing(false);
  }, [appliedFilters, loadReport]);

  function applyFilters() {
    setAppliedFilters({ fromDate, toDate, glCode: selectedGLCode });
    setFiltersExpanded(false);
  }

  function selectGLCode(code: string | null) {
    setSelectedGLCode(code);
    setGLCodeModalVisible(false);
    setGLCodeSearch("");
  }

  const filteredGLCodes = glCodes.filter((item) => {
    const search = glCodeSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      item.glCode.toLowerCase().includes(search) ||
      (item.description ?? "").toLowerCase().includes(search)
    );
  });

  // If navigated here again with a new date range (e.g. from the
  // Dashboard), sync state to it instead of keeping the previous visit's.
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
    setSelectedGLCode(null);
    setAppliedFilters({ fromDate: from, toDate: to, glCode: null });
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

  const totalRM = items.reduce((sum, item) => sum + item.rm, 0);

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

          <Pressable
            onPress={() => setGLCodeModalVisible(true)}
            style={({ pressed }) => [
              styles.glCodeSelector,
              pressed && styles.dateSelectorPressed,
            ]}
          >
            <Ionicons name="pricetag-outline" size={18} color={BRAND_COLOR} />
            <Text style={styles.glCodeSelectorText}>
              {selectedGLCode ? selectedGLCode.trim() : "All GL Codes"}
            </Text>
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
        </CollapsibleFilterSection>
      </View>

      {!loading && !errorMessage && items.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Entries</Text>
            <Text style={styles.summaryValue}>{items.length}</Text>
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

      <Modal
        visible={glCodeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGLCodeModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
        >
          <Pressable
            style={styles.modalOverlayTouchable}
            onPress={() => setGLCodeModalVisible(false)}
          >
            <Pressable
              style={[styles.glCodeModalCard, { paddingBottom: insets.bottom }]}
              onPress={() => {}}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select GL Code</Text>
                <Pressable onPress={() => setGLCodeModalVisible(false)}>
                  <Text style={styles.modalDone}>Close</Text>
                </Pressable>
              </View>
              <View style={styles.glCodeSearchWrapper}>
                <Ionicons name="search-outline" size={16} color="#9CA3AF" />
                <TextInput
                  value={glCodeSearch}
                  onChangeText={setGLCodeSearch}
                  placeholder="Search GL code or description"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.glCodeSearchInput}
                />
              </View>
              <FlatList
                data={filteredGLCodes}
                keyExtractor={(item) => item.glCode}
                style={styles.glCodeList}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                  glCodeSearch.trim() ? null : (
                    <Pressable
                      onPress={() => selectGLCode(null)}
                      style={styles.glCodeOption}
                    >
                      <Text style={styles.glCodeOptionText}>
                        All GL Codes
                      </Text>
                      {selectedGLCode === null && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={BRAND_COLOR}
                        />
                      )}
                    </Pressable>
                  )
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => selectGLCode(item.glCode)}
                    style={styles.glCodeOption}
                  >
                    <View style={styles.glCodeOptionTextWrapper}>
                      <Text style={styles.glCodeOptionText}>
                        {item.glCode.trim()}
                      </Text>
                      {item.description && (
                        <Text style={styles.glCodeOptionDescription}>
                          {item.description.trim()}
                        </Text>
                      )}
                    </View>
                    {selectedGLCode === item.glCode && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={BRAND_COLOR}
                      />
                    )}
                  </Pressable>
                )}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

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
              loadReport(
                appliedFilters.fromDate,
                appliedFilters.toDate,
                appliedFilters.glCode,
              )
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
          keyExtractor={(item, index) => `${item.refNo}-${index}`}
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
              <Text style={styles.emptyText}>No expenses found</Text>
              <Text style={styles.emptySubtext}>for this date range</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.receiptNo} numberOfLines={1}>
                  {item.refNo}
                </Text>
                <Text style={[styles.amountValue, styles.amountValueRM]}>
                  RM {formatAmount(item.rm)}
                </Text>
              </View>

              <Text style={styles.transactionDate}>
                {formatTransactionDate(item.date)}
              </Text>

              <View style={styles.divider} />

              <View style={styles.metaRow}>
                {item.glCode && (
                  <Text style={styles.metaText}>GL: {item.glCode.trim()}</Text>
                )}
                {item.description && (
                  <Text style={styles.metaText}>
                    {item.description.trim()}
                  </Text>
                )}
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomActionNav />
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
  glCodeSelector: {
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
  glCodeSelectorText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayTouchable: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  glCodeModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  glCodeSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  glCodeSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  glCodeList: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  glCodeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  glCodeOptionTextWrapper: {
    flex: 1,
  },
  glCodeOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  glCodeOptionDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
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
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  receiptNo: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: Spacing.two,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  amountValueRM: {
    color: BRAND_COLOR,
  },
  metaRow: {
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
});
