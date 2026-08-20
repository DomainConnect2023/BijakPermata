import { useLocalSearchParams } from "expo-router";

import { DetailTransactionReportScreen } from "@/screens/transaction/detail-transaction-report-screen";

export default function Transaction() {
  const { date } = useLocalSearchParams<{ date?: string }>();

  return <DetailTransactionReportScreen initialDate={date} />;
}
