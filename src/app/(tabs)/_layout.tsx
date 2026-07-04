import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/theme/theme';

export default function TabsLayout() {
  return (
    // Standard iOS 26 Liquid Glass tab bar (native, full-width, no detached button).
    <NativeTabs blurEffect="systemChromeMaterial" tintColor={colors.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="activity">
        <NativeTabs.Trigger.Label>Logs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="terminal" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="crew">
        <NativeTabs.Trigger.Label>Crew</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
