import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GatewayBanner } from '@/components/ui/gateway-banner';
import { AppProvider } from '@/store/app-store';

// OS pushes belong OUTSIDE the app (lock screen, notification list).
// Inside the app the board itself is the nudge — no foreground banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  // One-time OS permission ask; granting it is also what lets simulated
  // pushes (xcrun simctl push) render during demos.
  useEffect(() => {
    Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  }, []);
  // Only two loaded voices remain (2026-07-14): the body voice is now
  // Helvetica Neue, which ships with iOS — nothing to download.
  const [fontsLoaded] = useFonts({
    // the brand serif: wordmark + brand moments only
    'InstrumentSerif-Regular': require('../../assets/fonts/InstrumentSerif-Regular.ttf'),
    // the label voice behind the fontFamily.mono tokens (window-title
    // strips, times, counts — the MAFTUNA ref)
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          {/* Root stack: the tab bar lives in (tabs); opening a conversation
              pushes chat/[id] full-screen over the tabs (like Telegram). */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="crew/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="calendar" options={{ presentation: 'card' }} />
            <Stack.Screen name="access" options={{ presentation: 'card' }} />
            <Stack.Screen name="settings" options={{ presentation: 'card' }} />
          </Stack>
          {/* Above the Stack so it renders over every tab/screen, notch-drop
              style — reads gatewayStatus directly from the store. */}
          <GatewayBanner />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
