import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/app-store';
import { colors, fontFamily } from '@/theme/theme';

/**
 * COMPACT CUSTOM NAV (2026-07-22 "사이즈가 여전히 큰데": the native
 * Liquid Glass bar's height is Apple's floor, so the bar went
 * hand-built): a 44pt icon-only pill in the board's frost + the
 * detached "+" circle — Instagram density, clawstin material. The
 * Activity >_ takeover flips it to the night plate. Hidden until
 * connected (the bar's first appearance = the app has opened).
 */
const BAR_H = 58;

// tabBar props come from react-navigation via expo-router; the types
// package isn't a direct dependency, so the two fields we use are
// typed structurally
function CompactBar({
  state,
  navigation,
}: {
  state: { index: number; routes: { name: string; key: string }[] };
  navigation: { navigate: (name: string) => void };
}) {
  const { connected, consoleLens } = useAppStore();
  const insets = useSafeAreaInsets();
  if (!connected) return null;
  const active = consoleLens ? '#8FBFF2' : colors.accent;
  const idle = consoleLens ? 'rgba(255,255,255,0.6)' : 'rgba(22,24,28,0.55)';
  const focusedName = state.routes[state.index]?.name;
  const items = [
    {
      name: 'index',
      label: 'Home',
      render: (c: string) => <Ionicons name="home" size={17} color={c} />,
    },
    {
      name: 'chat',
      label: 'Activity',
      render: (c: string) => <Ionicons name="layers" size={17} color={c} />,
    },
    {
      name: 'crew',
      label: 'Crew',
      render: (c: string) => (
        <Image
          source={require('../../../assets/tabs/tab-crew.png')}
          style={{ width: 18, height: 18, tintColor: c }}
          resizeMode="contain"
        />
      ),
    },
  ];
  return (
    <>
      {/* scroll-edge fade (2026-07-22 "섹션이랑 같은 색이라 안 보여"):
          Apple's own answer to clear glass over light content — the
          desk blue rises softly behind the bar, so the glass always
          has field to refract. Night plane under the >_ lens. */}
      <Svg
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 130,
        }}>
        <Defs>
          <LinearGradient id="edgeFade" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={consoleLens ? '#1E3D63' : '#4B80B6'}
              stopOpacity="0"
            />
            <Stop
              offset="0.55"
              stopColor={consoleLens ? '#1E3D63' : '#4B80B6'}
              stopOpacity="0.75"
            />
            <Stop
              offset="1"
              stopColor={consoleLens ? '#1E3D63' : '#4B80B6'}
              stopOpacity="0.95"
            />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#edgeFade)" />
      </Svg>
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + 4,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
      }}>
      {/* REAL Liquid Glass (expo-glass-effect; 2026-07-22 "애플
          글라스 스타일은 그대로"): the system material on our own
          compact capsule — true arcs via native borderRadius */}
      <GlassView
        glassEffectStyle="clear"
        colorScheme={consoleLens ? 'dark' : 'light'}
        style={{
          flexDirection: 'row',
          height: BAR_H,
          borderRadius: BAR_H / 2,
          // rim math (2026-07-22 "프로페셔널하게 정확하지가"): the slug
          // is inset (BAR_H - slugH)/2 = 7 vertically, so the end
          // slots must land 7 from the caps too — 4 here + 3 on each
          // slot = concentric capsules, equal rim all the way around
          paddingHorizontal: 4,
          alignItems: 'center',
        }}>
        {items.map((it) => {
          const focused = focusedName === it.name;
          return (
            <Pressable
              key={it.name}
              onPress={() => navigation.navigate(it.name as never)}
              hitSlop={6}
              style={({ pressed }) => ({
                paddingHorizontal: 3,
                height: BAR_H,
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}>
              {/* icon + name stacked; the ACTIVE slot rides a raised
                  slug inside the pill — a SQUAT capsule (2026-07-22
                  "좀 더 알약": wider than tall, flatter through the
                  middle), not a near-circle */}
              <View
                style={{
                  height: BAR_H - 14,
                  minWidth: 80,
                  paddingHorizontal: 14,
                  borderRadius: (BAR_H - 14) / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  backgroundColor: focused
                    ? consoleLens
                      ? 'rgba(255,255,255,0.16)'
                      : 'rgba(255,255,255,0.55)'
                    : 'transparent',
                  // tight, centered shadow: an offset drop read as an
                  // uneven top/bottom gap ("균일한 엣지 간격이 아니야")
                  shadowColor: '#16181C',
                  shadowOpacity: focused && !consoleLens ? 0.1 : 0,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 0 },
                }}>
                {it.render(focused ? active : idle)}
                <Text
                  style={{
                    fontSize: 9.5,
                    fontFamily: fontFamily.medium,
                    color: focused ? active : idle,
                  }}>
                  {it.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </GlassView>
      {/* the detached chat "+": a REAL button now (the ask-route
          bounce hack retired with the native bar) */}
      <Pressable
        onPress={() =>
          router.push({ pathname: '/chat/[id]', params: { id: 'new' } })
        }
        style={({ pressed }) => ({
          width: BAR_H,
          height: BAR_H,
          borderRadius: BAR_H / 2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}>
        <GlassView
          glassEffectStyle="clear"
          colorScheme={consoleLens ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: BAR_H / 2 }]}
        />
        <Ionicons
          name="add"
          size={22}
          color={consoleLens ? '#8FBFF2' : 'rgba(22,24,28,0.75)'}
        />
      </Pressable>
    </View>
    </>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CompactBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="crew" />
      {/* the old native-search bounce route, off the bar entirely */}
      <Tabs.Screen name="ask" options={{ href: null }} />
    </Tabs>
  );
}
