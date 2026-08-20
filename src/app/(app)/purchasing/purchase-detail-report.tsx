import { useLocalSearchParams } from "expo-router";

import { PurchaseDetailReportScreen } from "@/screens/purchasing/purchase-detail-report-screen";

export default function PurchaseDetailReport() {
  const { date } = useLocalSearchParams<{ date?: string }>();

  return <PurchaseDetailReportScreen initialDate={date} />;
}
