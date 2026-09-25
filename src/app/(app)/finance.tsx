import { useLocalSearchParams } from "expo-router";

import { ExpenseListingScreen } from "@/screens/finance/expense-listing-screen";

export default function Finance() {
  const { fromDate, toDate } = useLocalSearchParams<{
    fromDate?: string;
    toDate?: string;
  }>();
  return (
    <ExpenseListingScreen initialFromDate={fromDate} initialToDate={toDate} />
  );
}
