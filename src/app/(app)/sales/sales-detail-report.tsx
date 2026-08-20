import { useLocalSearchParams } from "expo-router";

import { SalesDetailReportScreen } from "@/screens/sales/sales-detail-report-screen";

export default function SalesDetailReport() {
  const { date } = useLocalSearchParams<{ date?: string }>();

  return <SalesDetailReportScreen initialDate={date} />;
}
