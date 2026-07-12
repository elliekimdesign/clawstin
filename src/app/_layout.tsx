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
  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': require('../../assets/fonts/InstrumentSans-Regular.ttf'),
    'InstrumentSans-Medium': require('../../assets/fonts/InstrumentSans-Medium.ttf'),
    'InstrumentSans-SemiBold': require('../../assets/fonts/InstrumentSans-SemiBold.ttf'),
    'InstrumentSans-Bold': require('../../assets/fonts/InstrumentSans-Bold.ttf'),
    // the companion display serif: the wordmark's voice
    'InstrumentSerif-Regular': require('../../assets/fonts/InstrumentSerif-Regular.ttf'),
    // the system voice: ultraclean modern mono for labels/times/counts
    'GeistMono-Regular': require('../../assets/fonts/GeistMono-Regular.ttf'),
    // label voice candidate: clean geometric sans (the MAFTUNA ref)
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
