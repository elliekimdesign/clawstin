import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { RawStepSheet } from '@/components/ui/raw-step-sheet';
import type { ActivityDay, ActivityItem, LogStep } from '@/mock/activity';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, fontWeight, spacing } from '@/theme/theme';

// Console palette: the bliss field at night. Same brand blue and green
// as the other tabs, blended dark; text sits straight on the gradient.
const CONSOLE = {
  bg: '#141F33',
  text: 'rgba(255,255,255,0.9)',
  dim: 'rgba(255,255,255,0.48)',
  faint: 'rgba(255,255,255,0.32)',
  agent: '#8FBFF2', // light brand blue: who ran it
  ok: '#7ED9A0',
  err: '#FF8A7A',
  wait: '#F0B25F',
};

/** Full-screen night gradient: ink navy -> deep brand blue -> deep hill
 * green, on the same diagonal as the bliss field. */
function NightField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="night" x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset="0%" stopColor="#141F33" />
            <Stop offset="45%" stopColor="#1A3550" />
            <Stop offset="100%" stopColor="#1E4029" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#night)" />
      </Svg>
    </View>
  );
}

const GROUPS: { key: ActivityDay; label: string }[] = [
  { key: 'today', label: '# today' },
  { key: 'yesterday', label: '# yesterday' },
];

/** The closing line of a run block: how it ended. */
function closeLine(item: ActivityItem): { text: string; color: string } {
  if (item.status === 'failed') {
    return { text: 'failed', color: CONSOLE.err };
  }
  if (item.status === 'needs_approval') {
    return { text: 'paused · waiting for approval', color: CONSOLE.wait };
  }
  const n = item.steps?.length ?? 0;
  return {
    text: `done · ${n} steps${item.total ? ` · ${item.total}` : ''}`,
    color: CONSOLE.dim,
  };
}

/** One run block: sans prompt anchor line, then the mono machine steps.
 * Tap → the conversation it came from (troubleshoot → context). */
function RunBlock({
  item,
  agentName,
  onStep,
}: {
  item: ActivityItem;
  agentName: string;
  onStep: (step: LogStep, item: ActivityItem) => void;
}) {
  const close = closeLine(item);
  return (
    <Pressable
      onPress={() => router.push(`/chat/${item.threadId}`)}
      style={({ pressed }) => ({
        paddingVertical: 12,
        opacity: pressed ? 0.6 : 1,
      })}>
      {/* anchor: [time] agent · prompt (sans, the human handle) */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ fontFamily: fontFamily.mono, fontSize: 12, color: CONSOLE.faint }}>
          [{item.time}]
        </Text>
        <Text style={{ fontFamily: fontFamily.mono, fontSize: 12, color: CONSOLE.agent }}>
          {agentName.toLowerCase()}
        </Text>
        <Text
          style={{
            flex: 1,
            color: CONSOLE.text,
            fontSize: fontSize.small,
            fontWeight: fontWeight.semibold,
          }}
          numberOfLines={1}>
          {item.prompt}
        </Text>
      </View>

      {/* machine steps */}
      <View style={{ marginTop: 7, gap: 4 }}>
        {(item.steps ?? []).map((step, i) => {
          const color =
            step.state === 'err'
              ? CONSOLE.err
              : step.state === 'wait'
                ? CONSOLE.wait
                : CONSOLE.dim;
          const glyph = step.state === 'err' ? '✗' : step.state === 'wait' ? '…' : '✓';
          const glyphColor =
            step.state === 'err'
              ? CONSOLE.err
              : step.state === 'wait'
                ? CONSOLE.wait
                : CONSOLE.ok;
          return (
            <Pressable
              key={i}
              onPress={() => onStep(step, item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.5 : 1,
              })}>
              <Text
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 12,
                  color: CONSOLE.faint,
                  width: 28,
                  paddingLeft: 6,
                }}>
                {'├'}
              </Text>
              <Text
                style={{ flex: 1, fontFamily: fontFamily.mono, fontSize: 12, color }}
                numberOfLines={1}>
                {step.label}
                {step.ms ? ` · ${step.ms}` : ''}
              </Text>
              <Text style={{ fontFamily: fontFamily.mono, fontSize: 12, color: glyphColor }}>
                {glyph}
              </Text>
            </Pressable>
          );
        })}
        {/* closing line */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 12,
              color: CONSOLE.faint,
              width: 28,
              paddingLeft: 6,
            }}>
            {'└'}
          </Text>
          <Text
            style={{ flex: 1, fontFamily: fontFamily.mono, fontSize: 12, color: close.color }}
            numberOfLines={1}>
            {close.text}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Logs — the backstage engine room: what each agent actually did per
 * run (API calls, durations, retries, errors), streamed like a console
 * straight onto the night gradient. The chat surfaces show the human
 * side; this shows the machine side. */
export default function ActivityScreen() {
  const { activity, crew } = useAppStore();
  const byId = Object.fromEntries(crew.map((m) => [m.id, m]));

  // grep: all | errors | one agent id
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  // drill-down: the step whose raw payload is open
  const [selected, setSelected] = useState<{ step: LogStep; item: ActivityItem } | null>(null);

  const matches = (a: ActivityItem) =>
    filter === 'all'
      ? true
      : filter === 'errors'
        ? a.status === 'failed' || (a.steps ?? []).some((st) => st.state === 'err')
        : a.agentId === filter;
  const filtered = activity.filter(matches);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CONSOLE.bg }} edges={['top']}>
      <StatusBar style="light" />
      <NightField />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}>
        {/* slim terminal title bar: path left, live tail right */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.md,
            marginBottom: spacing.lg,
          }}>
          <Text style={{ fontFamily: fontFamily.mono, fontSize: 12, color: CONSOLE.faint }}>
            ~/clawstin
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: CONSOLE.ok }}
              />
              <Text style={{ fontFamily: fontFamily.mono, fontSize: 12, color: CONSOLE.dim }}>
                live
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (filterOpen) setFilter('all');
                setFilterOpen(!filterOpen);
              }}
              hitSlop={8}>
              <Ionicons
                name="funnel-outline"
                size={15}
                color={filter !== 'all' ? CONSOLE.ok : CONSOLE.dim}
              />
            </Pressable>
          </View>
        </View>

        {/* grep bar: filter the stream by agent or errors only */}
        {filterOpen ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: spacing.md,
            }}>
            {[
              { key: 'all', label: 'all' },
              { key: 'errors', label: 'errors' },
              ...crew.map((m) => ({ key: m.id, label: m.name.toLowerCase() })),
            ].map((chip) => (
              <Pressable
                key={chip.key}
                onPress={() => setFilter(chip.key)}
                style={{
                  borderRadius: 999,
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  backgroundColor:
                    filter === chip.key ? '#2E7CD6' : 'rgba(255,255,255,0.08)',
                }}>
                <Text
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 12,
                    color: filter === chip.key ? '#FFFFFF' : CONSOLE.dim,
                  }}>
                  {chip.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {filtered.length === 0 ? (
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 12,
              color: CONSOLE.faint,
              paddingVertical: 8,
            }}>
            # no matches
          </Text>
        ) : (
          GROUPS.map(({ key, label }) => {
            const items = filtered.filter((a) => a.day === key);
            if (items.length === 0) return null;
            return (
              <View key={key}>
                <Text
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 12,
                    color: CONSOLE.faint,
                    paddingVertical: 8,
                  }}>
                  {label}
                </Text>
                {items.map((item) => (
                  <RunBlock
                    key={item.id}
                    item={item}
                    agentName={byId[item.agentId]?.name ?? 'crew'}
                    onStep={(step, it) => setSelected({ step, item: it })}
                  />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* depth on demand: raw payload for the tapped step */}
      <RawStepSheet
        step={selected?.step ?? null}
        item={selected?.item ?? null}
        agentName={selected ? (byId[selected.item.agentId]?.name ?? 'crew') : ''}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}
