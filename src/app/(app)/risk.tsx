import { useLocalSearchParams } from "expo-router";

import { DataRiskReportScreen } from "@/screens/risk/data-risk-report-screen";

export default function Risk() {
  const { fromDate, toDate } = useLocalSearchParams<{
    fromDate?: string;
    toDate?: string;
  }>();

  return (
    <DataRiskReportScreen initialFromDate={fromDate} initialToDate={toDate} />
  );
}
