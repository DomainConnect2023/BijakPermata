import { useLocalSearchParams } from "expo-router";

import { PurchaseDetailTransactionsScreen } from "@/screens/purchasing/purchase-detail-transactions-screen";

export default function PurchaseDetailTransactions() {
  const { currency, fromDate, toDate } = useLocalSearchParams<{
    currency: string;
    fromDate: string;
    toDate: string;
  }>();

  return (
    <PurchaseDetailTransactionsScreen
      currency={currency ?? ""}
      fromDate={fromDate ?? ""}
      toDate={toDate ?? ""}
    />
  );
}
