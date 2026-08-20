import { useLocalSearchParams } from "expo-router";

import { MarginReportScreen } from "@/screens/margin/margin-report-screen";

export default function Margin() {
  const { date } = useLocalSearchParams<{ date?: string }>();

  return <MarginReportScreen initialDate={date} />;
}
