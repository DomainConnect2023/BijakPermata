import { Stack } from 'expo-router';

// The Daily Balance Report / Daily Stock Report switch used to be a native
// tab bar here; it's now the ReportSectionSwitcher on each screen, so this
// is a plain (invisible) stack instead of a Tabs navigator.
export const unstable_settings = {
  initialRouteName: 'daily-balance-report',
};

export default function DailyLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
