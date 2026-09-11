import { useLocalSearchParams } from "expo-router";

import { DetailTransactionReportScreen } from "@/screens/transaction/detail-transaction-report-screen";

export default function Transaction() {
  const { fromDate, toDate, customerType } = useLocalSearchParams<{
    fromDate?: string;
    toDate?: string;
    customerType?: string;
  }>();

  return (
    <DetailTransactionReportScreen
      initialFromDate={fromDate}
      initialToDate={toDate}
      initialCustomerType={customerType}
    />
  );
}
