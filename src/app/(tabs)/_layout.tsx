import { Ionicons } from '@expo/vector-icons';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontFamily } from '@/theme/theme';

// Floating dock tab bar (reference: dark rounded pill hovering above the
// bottom edge; each item is icon-over-label, the active one sits on a
// lighter rounded plate).
const BAR_BG = 'rgba(26,28,33,0.96)'; // BENTO.charcoal, slightly translucent
const ACTIVE_PLATE = 'rgba(255,255,255,0.16)';
const ON_BAR = '#FFFFFF';
const ON_BAR_DIM = 'rgba(255,255,255,0.55)';

const TAB_META: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  index: { label: 'Home', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  activity: { label: 'Activity', icon: 'flash-outline', iconActive: 'flash' },
  crew: { label: 'Crew', icon: 'people-outline', iconActive: 'people' },
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, 12),
        alignItems: 'center',
      }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: BAR_BG,
          borderRadius: 999,
          padding: 6,
          gap: 4,
          shadowColor: '#000000',
          shadowOpacity: 0.22,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }}>
        {state.routes.map((route, i) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => ({
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 76,
                paddingVertical: 9,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: focused ? ACTIVE_PLATE : 'transparent',
                opacity: pressed ? 0.8 : 1,
              })}>
              <Ionicons
                name={focused ? meta.iconActive : meta.icon}
                size={20}
                color={focused ? ON_BAR : ON_BAR_DIM}
              />
              <Text
                style={{
                  color: focused ? ON_BAR : ON_BAR_DIM,
                  fontSize: 11,
                  fontFamily: fontFamily.medium,
                  marginTop: 3,
                }}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="crew" />
    </Tabs>
  );
}
