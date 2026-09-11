import { Stack } from 'expo-router';

// The Sales Detail Report / Sale Cancel Report switch used to be a native
// tab bar here; it's now the 2-box ReportSectionSwitcher on each screen, so
// this is a plain (invisible) stack instead of a Tabs navigator.
export const unstable_settings = {
  initialRouteName: 'sales-detail-report',
};

export default function SalesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
