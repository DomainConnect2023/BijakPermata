import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="setting-edit-profile"
          options={{ headerShown: true, title: 'Edit Profile' }}
        />
        <Stack.Screen
          name="setting-change-password"
          options={{ headerShown: true, title: 'Change Password' }}
        />
        <Stack.Screen
          name="setting-users"
          options={{ headerShown: true, title: 'User Management' }}
        />
        <Stack.Screen
          name="setting-access"
          options={{ headerShown: true, title: 'Access Control' }}
        />
        <Stack.Screen
          name="setting-access-detail"
          options={{ headerShown: true, title: 'Assign Users' }}
        />
        <Stack.Screen
          name="purchase-detail-transactions"
          options={{ headerShown: true, title: 'Transactions' }}
        />
        <Stack.Screen
          name="sales-detail-transactions"
          options={{ headerShown: true, title: 'Transactions' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
