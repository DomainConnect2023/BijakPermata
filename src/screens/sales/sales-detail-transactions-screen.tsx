import { Ionicons } from "@expo/vector-icons";
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
import {
  type PurchaseSalesTransactionItem,
  fetchPurchaseSales,
  parseDateParam,
} from "@/services/report-api";

const BRAND_COLOR = "#208AEF";

function formatDisplayDate(value: string): string {
  return parseDateParam(value).toLocaleDateString("en-GB", {
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

type Props = {
  currency: string;
  fromDate: string;
  toDate: string;
};

export function SalesDetailTransactionsScreen({
  currency,
  fromDate,
  toDate,
}: Props) {
  const { loading: permissionLoading, access } = usePageAccess([
    "SalesDetail",
  ]);

  const [items, setItems] = useState<PurchaseSalesTransactionItem[]>([]);
  const [totalFCAmount, setTotalFCAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setErrorMessage(null);
    try {
      const groups = await fetchPurchaseSales(
        parseDateParam(fromDate),
        parseDateParam(toDate),
        "S",
      );
      const group = groups.find((g) => g.currency === currency);
      setItems(group?.items ?? []);
      setTotalFCAmount(group?.totalFCAmount ?? 0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load report",
      );
    }
  }, [currency, fromDate, toDate]);

  useEffect(() => {
    if (permissionLoading || !access.SalesDetail) return;
    (async () => {
      setLoading(true);
      await loadReport();
      setLoading(false);
    })();
  }, [loadReport, permissionLoading, access.SalesDetail]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  }, [loadReport]);

  const totalRM = items.reduce((sum, item) => sum + item.rm, 0);

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
      <View style={styles.headerCard}>
        <View style={styles.badgeCircle}>
          <Text style={styles.badgeText}>{currency.trim()}</Text>
        </View>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerAmount}>
            {currency.trim()} {formatAmount(totalFCAmount)}
          </Text>
          <Text style={styles.headerSubtext}>
            {formatDisplayDate(fromDate)} - {formatDisplayDate(toDate)}
          </Text>
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

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={BRAND_COLOR} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={loadReport} style={styles.retryButton}>
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
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.receiptNo} numberOfLines={1}>
                  {item.receiptNo}
                </Text>
                <Text style={styles.transactionDate}>
                  {formatTransactionDate(item.date)}
                </Text>
              </View>

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
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: "#FFFFFF",
    margin: Spacing.four,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: 16,
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
  headerTextWrapper: {
    flex: 1,
  },
  headerAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: Spacing.four,
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
  listContent: {
    paddingHorizontal: Spacing.four,
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
