import { useLocalSearchParams } from "expo-router";

import { SalesDetailTransactionsScreen } from "@/screens/sales/sales-detail-transactions-screen";

export default function SalesDetailTransactions() {
  const { currency, fromDate, toDate } = useLocalSearchParams<{
    currency: string;
    fromDate: string;
    toDate: string;
  }>();

  return (
    <SalesDetailTransactionsScreen
      currency={currency ?? ""}
      fromDate={fromDate ?? ""}
      toDate={toDate ?? ""}
    />
  );
}
