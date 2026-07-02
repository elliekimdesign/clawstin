import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { InfraState, maskToken } from '@/mock/infra';
import { useAppStore } from '@/store/app-store';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

const MONO = 'Menlo';
const INFRA_DOT: Record<InfraState, string> = {
  connected: colors.success,
  degraded: colors.warning,
  down: colors.danger,
};

export default function AccessScreen() {
  const { permissions, requestLog, togglePermission, infra, setConnected } = useAppStore();

  // Deep-link highlight: status popover navigates with ?focus=infra.
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const glow = useSharedValue(0);
  useEffect(() => {
    if (focus === 'infra') {
      glow.value = withSequence(
        withTiming(1, { duration: 250 }),
        withDelay(1000, withTiming(0, { duration: 400 }))
      );
    }
  }, [focus, glow]);
  const infraCardStyle = useAnimatedStyle(() => ({
    borderWidth: 1,
    borderColor: `rgba(22,24,29,${glow.value * 0.9})`,
  }));

  return (
    <Screen title="Access">
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}>
        {/* Group A — Infrastructure (gateway + tokens) */}
        <SectionHeader title="INFRASTRUCTURE" />
        <Animated.View style={[{ borderRadius: radius.lg }, infraCardStyle]}>
          <Card padded={false}>
            {infra.map((e, i) => (
              <Pressable
                key={e.id}
                onPress={() => router.push(`/access-detail/${e.id}`)}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.lg,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.divider,
                  }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: radius.sm,
                      backgroundColor: colors.cardAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Ionicons name={e.icon} size={17} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: fontSize.body,
                        fontWeight: fontWeight.semibold,
                      }}>
                      {e.label}
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 12.5,
                        fontFamily: MONO,
                        letterSpacing: 0.4,
                        marginTop: 3,
                      }}
                      numberOfLines={1}>
                      {e.masked ? maskToken(e.value) : e.value}
                    </Text>
                  </View>
                  {/* status dot sits by the chevron so all value rows align */}
                  <View
                    style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: INFRA_DOT[e.state] }}
                  />
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </View>
              </Pressable>
            ))}
          </Card>
        </Animated.View>

        {/* Group B — Data & skills (toggles) */}
        <SectionHeader title="DATA & SKILLS" trailing="Muppet Permissions" />
        <Card padded={false}>
          {permissions.map((p, i) => (
            <View
              key={p.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.divider,
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.sm,
                  backgroundColor: p.enabled ? colors.accentSoft : colors.cardAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons
                  name={p.icon}
                  size={17}
                  color={p.enabled ? colors.text : colors.textTertiary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: fontSize.body,
                    fontWeight: fontWeight.semibold,
                  }}>
                  {p.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.small, marginTop: 2 }}>
                  {p.detail}
                </Text>
              </View>
              <Switch
                value={p.enabled}
                onValueChange={() => togglePermission(p.key)}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
              />
            </View>
          ))}
        </Card>

        {/* Group C — Request log (compact: latest 3, full list in Activity) */}
        <SectionHeader title="RECENT REQUESTS" />
        <Card padded={false}>
          {requestLog.slice(0, 3).map((r, i) => (
            <View
              key={r.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.divider,
              }}>
              <Ionicons
                name={r.result === 'Approved' ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={r.result === 'Approved' ? colors.success : colors.danger}
              />
              <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}>{r.text}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: fontSize.caption }}>{r.time}</Text>
            </View>
          ))}
        </Card>

        {/* View all → warps to the Activity tab (no new screen) */}
        <Pressable
          onPress={() => router.navigate('/(tabs)/activity')}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.55 : 1,
          })}>
          <Text
            style={{ color: colors.textSecondary, fontSize: fontSize.small, fontWeight: fontWeight.semibold }}>
            View all in Activity
          </Text>
          <Ionicons name="arrow-forward" size={13} color={colors.textSecondary} />
        </Pressable>

        {/* Connection */}
        <SectionHeader title="CONNECTION" />
        <Pressable
          onPress={() => setConnected(false)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.dangerSoft,
            }}>
            <Ionicons name="power" size={18} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: fontSize.body, fontWeight: fontWeight.semibold }}>
              Disconnect agent
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
