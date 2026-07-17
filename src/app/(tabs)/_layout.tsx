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
      {/* icon voices (2026-07-17): Home and Activity moved to modern
          SF Symbols; only Crew keeps the mascot's pixel language — the
          crew ARE the pixel characters, so their door stays pixel */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="apple.terminal" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="crew">
        <NativeTabs.Trigger.Label>Crew</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('../../../assets/tabs/tab-crew.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {/* the detached circle beside the pill (iOS 26 search-role slot):
          ours is the CHAT button — selecting it bounces back to Home
          and pushes the compose on top (see ask.tsx), since native
          triggers can only be routes, never plain buttons */}
      <NativeTabs.Trigger name="ask" role="search">
        <NativeTabs.Trigger.Label hidden>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
