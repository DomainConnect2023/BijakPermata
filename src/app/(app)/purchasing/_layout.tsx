import { Stack } from 'expo-router';

// The Purchase Detail Report / Buy Cancel switch used to be a native tab
// bar here; it's now the 2-box ReportSectionSwitcher on each screen, so
// this is a plain (invisible) stack instead of a Tabs navigator.
export const unstable_settings = {
  initialRouteName: 'purchase-detail-report',
};

export default function PurchasingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
