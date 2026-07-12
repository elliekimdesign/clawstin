import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAppStore } from '@/store/app-store';
import { colors } from '@/theme/theme';

export default function TabsLayout() {
  // Before setup, Get started is the ONLY exit: no tab bar until the
  // app is connected. Its first appearance is itself the signal that
  // the app has opened.
  const { connected } = useAppStore();
  return (
    // Standard iOS 26 Liquid Glass tab bar (native, full-width, no detached button).
    <NativeTabs
      blurEffect="systemChromeMaterial"
      tintColor={colors.accent}
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
