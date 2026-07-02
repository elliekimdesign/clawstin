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
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bolt" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="memory">
        <NativeTabs.Trigger.Label>Memory</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="access">
        <NativeTabs.Trigger.Label>Access</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="key" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
