import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/theme/theme';

export default function TabsLayout() {
  return (
    // Standard iOS 26 Liquid Glass tab bar (native, full-width, no detached button).
    <NativeTabs blurEffect="systemChromeMaterial" tintColor={colors.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="message" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="crew">
        <NativeTabs.Trigger.Label>Crew</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
