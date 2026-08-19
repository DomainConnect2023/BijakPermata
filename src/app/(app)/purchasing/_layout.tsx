import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function PurchasingLayout() {
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
        name="purchase-detail-report"
        options={{
          title: 'Purchase Detail Report',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="buy-cancel"
        options={{
          title: 'Buy Cancel',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="close-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
