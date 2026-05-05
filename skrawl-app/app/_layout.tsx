import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '@/src/services/database';
import { seedIfEmpty } from '@/src/services/seed';
import { useUIStore } from '@/src/store/ui-store';
import { useSyncStore } from '@/src/store/sync-store';
import { NudgeToast } from '@/src/components/common/NudgeToast';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const theme = useUIStore((s) => s.theme);
  const initAuth = useSyncStore((s) => s.initAuth);

  useEffect(() => {
    initDatabase()
      .then(() => seedIfEmpty())
      .then(() => initAuth())
      .then(() => SplashScreen.hideAsync())
      .then(() => setDbReady(true))
      .then(() => new Promise((r) => setTimeout(r, 1500)))
      .then(() => setAppReady(true))
      .catch(console.error);
  }, []);

  if (!appReady) {
    const quotes = [
      "Your mind is for having ideas, not holding them.",
      "Done is better than perfect.",
      "Small daily improvements lead to stunning results.",
      "Getting started is getting ahead.",
      "Progress, not perfection.",
    ];
    const quote = quotes[Math.floor(Date.now() / 1000) % quotes.length];
    return (
      <View style={loadStyles.container}>
        <Text style={loadStyles.logo}>
          <Text style={{ color: '#F0F0F5' }}>Skrawl</Text>
          <Text style={{ color: '#FF6AC2' }}>.</Text>
        </Text>
        <Text style={loadStyles.tagline}>Notes, tasks & reminders</Text>
        <ActivityIndicator size="small" color="#7C6AFF" style={{ marginTop: 24 }} />
        <Text style={loadStyles.quote}>"{quote}"</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
          <Stack.Screen name="focus" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
        </Stack>
      </BottomSheetModalProvider>
      <NudgeToast />
    </GestureHandlerRootView>
  );
}

const loadStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: '#55556A',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  quote: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#9595A5',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
});
