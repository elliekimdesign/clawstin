import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '@/store/app-store';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': require('../../assets/fonts/InstrumentSans-Regular.ttf'),
    'InstrumentSans-Medium': require('../../assets/fonts/InstrumentSans-Medium.ttf'),
    'InstrumentSans-SemiBold': require('../../assets/fonts/InstrumentSans-SemiBold.ttf'),
    'InstrumentSans-Bold': require('../../assets/fonts/InstrumentSans-Bold.ttf'),
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
            <Stack.Screen name="approval/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="access-detail/[field]" options={{ presentation: 'modal' }} />
          </Stack>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
