import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function SalesLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen
        name="sales-detail-report"
        options={{
          title: 'Sales Detail Report',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sale-cancel-report"
        options={{
          title: 'Sale Cancel Report',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="close-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="margin-report"
        options={{
          title: 'Margin Report',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
