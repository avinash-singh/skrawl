import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '@/src/services/database';
import { seedIfEmpty } from '@/src/services/seed';
import { useUIStore } from '@/src/store/ui-store';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    initDatabase()
      .then(() => seedIfEmpty())
      .then(() => setDbReady(true))
      .then(() => SplashScreen.hideAsync())
      .catch(console.error);
  }, []);

  if (!dbReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
