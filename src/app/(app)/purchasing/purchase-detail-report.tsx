import { useLocalSearchParams } from "expo-router";

import { PurchaseDetailReportScreen } from "@/screens/purchasing/purchase-detail-report-screen";

export default function PurchaseDetailReport() {
  const { fromDate, toDate } = useLocalSearchParams<{
    fromDate?: string;
    toDate?: string;
  }>();

  return (
    <PurchaseDetailReportScreen
      initialFromDate={fromDate}
      initialToDate={toDate}
    />
  );
}
