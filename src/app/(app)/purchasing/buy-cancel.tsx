import { useLocalSearchParams } from "expo-router";

import { BuyCancelScreen } from '@/screens/purchasing/buy-cancel-screen';

export default function BuyCancel() {
  const { fromDate, toDate } = useLocalSearchParams<{
    fromDate?: string;
    toDate?: string;
  }>();
  return <BuyCancelScreen initialFromDate={fromDate} initialToDate={toDate} />;
}
