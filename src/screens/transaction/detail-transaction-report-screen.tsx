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

import { AccessDeniedView } from "@/components/access-denied-view";
import { Spacing } from "@/constants/theme";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  type DetailTransactionItem,
  type DetailTransactionStatus,
  fetchCurrencyList,
  fetchDetailTransactions,
} from "@/services/report-api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND_COLOR = "#208AEF";

const STATUS_OPTIONS: { value: DetailTransactionStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "B", label: "Buy" },
  { value: "S", label: "Sale" },
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

function getStatusMeta(status: string) {
  if (status === "B") {
    return { label: "Buy", color: "#22C55E", background: "#22C55E15" };
  }
  if (status === "S") {
    return { label: "Sale", color: "#EF4444", background: "#EF444415" };
  }
  return { label: status || "-", color: "#6B7280", background: "#F3F4F6" };
}

type ActivePicker = "from" | "to" | null;

export function DetailTransactionReportScreen() {
  const insets = useSafeAreaInsets();
  const { loading: permissionLoading, access } = usePageAccess([
    "DetailTransaction",
  ]);

  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(startOfDay(new Date()));
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const [currencies, setCurrencies] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<DetailTransactionStatus>("ALL");

  const [items, setItems] = useState<DetailTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchCurrencyList();
        setCurrencies(list.filter((code) => code && code.trim()));
      } catch {
        // Currency filter is optional; ignore load failure.
      }
    })();
  }, []);

  const loadReport = useCallback(
    async (
      from: Date,
      to: Date,
      currency: string | null,
      status: DetailTransactionStatus,
    ) => {
      setErrorMessage(null);
      try {
        const data = await fetchDetailTransactions(from, to, currency, status);
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
    if (permissionLoading || !access.DetailTransaction) return;
    (async () => {
      setLoading(true);
      await loadReport(fromDate, toDate, selectedCurrency, selectedStatus);
      setLoading(false);
    })();
  }, [
    fromDate,
    toDate,
    selectedCurrency,
    selectedStatus,
    loadReport,
    permissionLoading,
    access.DetailTransaction,
  ]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport(fromDate, toDate, selectedCurrency, selectedStatus);
    setRefreshing(false);
  }, [fromDate, toDate, selectedCurrency, selectedStatus, loadReport]);

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

  function selectCurrency(code: string | null) {
    setSelectedCurrency(code);
    setCurrencyModalVisible(false);
    setCurrencySearch("");
  }

  const filteredCurrencies = currencies.filter((code) =>
    code.trim().toLowerCase().includes(currencySearch.trim().toLowerCase()),
  );

  const totalRM = items.reduce((sum, item) => sum + item.rm, 0);

  if (permissionLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  if (!access.DetailTransaction) {
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

        <Pressable
          onPress={() => setCurrencyModalVisible(true)}
          style={({ pressed }) => [
            styles.currencySelector,
            pressed && styles.dateSelectorPressed,
          ]}
        >
          <Ionicons name="cash-outline" size={18} color={BRAND_COLOR} />
          <Text style={styles.currencySelectorText}>
            {selectedCurrency ? selectedCurrency.trim() : "All Currencies"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </Pressable>

        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((option) => {
            const active = selectedStatus === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setSelectedStatus(option.value)}
                style={[
                  styles.statusOption,
                  active && styles.statusOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    active && styles.statusOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!loading && !errorMessage && items.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Transactions</Text>
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
            style={styles.modalOverlayTouchable}
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
        visible={currencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
        >
          <Pressable
            style={styles.modalOverlayTouchable}
            onPress={() => setCurrencyModalVisible(false)}
          >
            <Pressable
              style={[
                styles.currencyModalCard,
                { paddingBottom: insets.bottom },
              ]}
              onPress={() => {}}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Currency</Text>
                <Pressable onPress={() => setCurrencyModalVisible(false)}>
                  <Text style={styles.modalDone}>Close</Text>
                </Pressable>
              </View>
              <View style={styles.currencySearchWrapper}>
                <Ionicons name="search-outline" size={16} color="#9CA3AF" />
                <TextInput
                  value={currencySearch}
                  onChangeText={setCurrencySearch}
                  placeholder="Search currency"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.currencySearchInput}
                />
              </View>
              <FlatList
                data={filteredCurrencies}
                keyExtractor={(code, index) => `${code}-${index}`}
                style={styles.currencyList}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                  currencySearch.trim() ? null : (
                    <Pressable
                      onPress={() => selectCurrency(null)}
                      style={styles.currencyOption}
                    >
                      <Text style={styles.currencyOptionText}>
                        All Currencies
                      </Text>
                      {selectedCurrency === null && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={BRAND_COLOR}
                        />
                      )}
                    </Pressable>
                  )
                }
                renderItem={({ item: code }) => (
                  <Pressable
                    onPress={() => selectCurrency(code)}
                    style={styles.currencyOption}
                  >
                    <Text style={styles.currencyOptionText}>{code.trim()}</Text>
                    {selectedCurrency === code && (
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
              loadReport(fromDate, toDate, selectedCurrency, selectedStatus)
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
          keyExtractor={(item, index) => `${item.receiptNo}-${index}`}
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
              <Ionicons
                name="swap-horizontal-outline"
                size={48}
                color="#D1D5DB"
              />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>for this filter</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusMeta = getStatusMeta(item.status);
            return (
              <View style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.receiptNo} numberOfLines={1}>
                    {item.receiptNo}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusMeta.background },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusMeta.color }]}
                    >
                      {statusMeta.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.transactionDate}>
                  {formatTransactionDate(item.date)} · {item.time}
                </Text>

                <View style={styles.divider} />

                <View style={styles.amountRow}>
                  <View style={styles.amountBlock}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>
                      {item.currency.trim()} {formatAmount(item.fcAmount)}
                    </Text>
                  </View>
                  <View style={styles.amountBlock}>
                    <Text style={styles.amountLabel}>Rate</Text>
                    <Text style={styles.amountValue}>
                      {item.rate.toFixed(4)}
                    </Text>
                  </View>
                  <View style={styles.amountBlock}>
                    <Text style={styles.amountLabel}>RM</Text>
                    <Text style={[styles.amountValue, styles.amountValueRM]}>
                      {formatAmount(item.rm)}
                    </Text>
                  </View>
                </View>

                {(item.customer || item.bank || item.pcCode) && (
                  <View style={styles.metaRow}>
                    {item.pcCode && (
                      <Text style={styles.metaText}>PC: {item.pcCode}</Text>
                    )}
                    {item.customer && (
                      <Text style={styles.metaText}>
                        Customer: {item.customer}
                      </Text>
                    )}
                    {item.bank && (
                      <Text style={styles.metaText}>Bank: {item.bank}</Text>
                    )}
                  </View>
                )}
              </View>
            );
          }}
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
  currencySelector: {
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
  currencySelectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  statusRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  statusOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.two,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusOptionActive: {
    backgroundColor: BRAND_COLOR,
    borderColor: BRAND_COLOR,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  statusOptionTextActive: {
    color: "#FFFFFF",
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
    fontSize: 18,
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
  },
  modalOverlayTouchable: {
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
  currencyModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  currencySearchWrapper: {
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
  currencySearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  currencyList: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  currencyOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
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
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
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
  amountRow: {
    flexDirection: "row",
  },
  amountBlock: {
    flex: 1,
    gap: 2,
  },
  amountLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
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
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
});
