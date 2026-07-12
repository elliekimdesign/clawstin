import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAppStore } from '@/store/app-store';
import { colors } from '@/theme/theme';

export default function TabsLayout() {
  // Before setup, Get started is the ONLY exit: no tab bar until the
  // app is connected. Its first appearance is itself the signal that
  // the app has opened.
  const { connected, consoleLens } = useAppStore();
  return (
    // Standard iOS 26 Liquid Glass tab bar (native, full-width, no detached button).
    // The Activity >_ takeover flips it to the dark material + the crew's
    // light blue so it stays legible on the night plane.
    <NativeTabs
      // blurEffect stays STATIC: swapping it at runtime tears down the
      // native bar (it vanished after a lens round-trip). The chrome
      // material already self-darkens over the terminal; only the tint
      // needs help there.
      blurEffect="systemChromeMaterial"
      tintColor={consoleLens ? '#8FBFF2' : colors.accent}
      hidden={!connected}>
      {/* pixel icons (2026-07-12): the tab bar speaks the mascot's
          24-grid pixel language; template mode lets iOS tint them */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('../../../assets/tabs/tab-home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('../../../assets/tabs/tab-activity.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="crew">
        <NativeTabs.Trigger.Label>Crew</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('../../../assets/tabs/tab-crew.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
