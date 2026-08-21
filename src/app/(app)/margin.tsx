import { useLocalSearchParams } from "expo-router";

import { MarginReportScreen } from "@/screens/margin/margin-report-screen";

export default function Margin() {
  const { fromDate, toDate } = useLocalSearchParams<{
    fromDate?: string;
    toDate?: string;
  }>();

  return (
    <MarginReportScreen initialFromDate={fromDate} initialToDate={toDate} />
  );
}
