import { useLocalSearchParams } from "expo-router";

import { SalesDetailReportScreen } from "@/screens/sales/sales-detail-report-screen";

export default function SalesDetailReport() {
  const { fromDate, toDate } = useLocalSearchParams<{
    fromDate?: string;
    toDate?: string;
  }>();

  return (
    <SalesDetailReportScreen
      initialFromDate={fromDate}
      initialToDate={toDate}
    />
  );
}
