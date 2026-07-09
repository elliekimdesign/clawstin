import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NightField } from '@/components/ui/night-field';
import { RawStepSheet } from '@/components/ui/raw-step-sheet';
import type { ActivityDay, ActivityItem, LogStep } from '@/mock/activity';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, fontWeight, spacing } from '@/theme/theme';

// Console palette: aurora night. Deep navy base under the command
// azure's halo and the home lime's aurora; text sits straight on the
// gradient. bg must equal NightField's top stop (SafeAreaView backfill).
const CONSOLE = {
  bg: '#0D1B36',
  text: 'rgba(255,255,255,0.9)',
  dim: 'rgba(255,255,255,0.48)',
  faint: 'rgba(255,255,255,0.32)',
  agent: '#8FBFF2', // light brand blue: who ran it
  ok: '#7ED9A0',
  err: '#FF8A7A',
  wait: '#F0B25F',
};

// Aurora night background, Logs-only — see
// src/components/ui/night-field.tsx.

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
  const { activity, crew, logsFilter, setLogsFilter } = useAppStore();
  const byId = Object.fromEntries(crew.map((m) => [m.id, m]));
  // The system log speaks in AGENT names (Orchestrator, Research…), not
  // character names — the role field's first segment is exactly that.
  const agentTitle = (id: string) => byId[id]?.role.split(' · ')[0] ?? 'crew';

  // grep: all | errors | one agent id
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  // free-text search over prompts, steps and agent names
  const [query, setQuery] = useState('');
  // drill-down: the step whose raw payload is open
  const [selected, setSelected] = useState<{ step: LogStep; item: ActivityItem } | null>(null);

  const matches = (a: ActivityItem) =>
    filter === 'all'
      ? true
      : filter === 'errors'
        ? a.status === 'failed' || (a.steps ?? []).some((st) => st.state === 'err')
        : a.agentId === filter;
  // drill-down chip from the AUTOPILOT sheet: narrows on top of the funnel
  const matchesDrill = (a: ActivityItem) =>
    !logsFilter ||
    (logsFilter.kind === 'source' ? a.source === logsFilter.value : a.ruleKey === logsFilter.value);
  const q = query.trim().toLowerCase();
  const matchesQuery = (a: ActivityItem) =>
    q.length === 0 ||
    a.prompt.toLowerCase().includes(q) ||
    agentTitle(a.agentId).toLowerCase().includes(q) ||
    (a.steps ?? []).some((st) => st.label.toLowerCase().includes(q));
  const filtered = activity.filter((a) => matches(a) && matchesQuery(a) && matchesDrill(a));

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={10}>
              <Ionicons name="chevron-back" size={18} color={CONSOLE.dim} />
            </Pressable>
            <Text style={{ fontFamily: fontFamily.mono, fontSize: 12, color: CONSOLE.faint }}>
              ~/clawstin
            </Text>
          </View>
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

        {/* search field: free-text grep over prompts, steps, agents */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 9,
            marginBottom: spacing.md,
          }}>
          <Ionicons name="search" size={13} color={CONSOLE.dim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="grep logs"
            placeholderTextColor={CONSOLE.faint}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              fontFamily: fontFamily.mono,
              fontSize: 13,
              color: CONSOLE.text,
              padding: 0,
            }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={15} color={CONSOLE.dim} />
            </Pressable>
          ) : null}
        </View>

        {/* drill-down chip: how you got here stays on screen; ✕ releases
            back to the full log */}
        {logsFilter ? (
          <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 999,
                paddingLeft: 12,
                paddingRight: 8,
                paddingVertical: 6,
              }}>
              <Text style={{ fontFamily: fontFamily.mono, fontSize: 12, color: CONSOLE.text }}>
                {`${logsFilter.kind}: ${logsFilter.value}`}
              </Text>
              <Pressable onPress={() => setLogsFilter(null)} hitSlop={8}>
                <Ionicons name="close" size={13} color={CONSOLE.dim} />
              </Pressable>
            </View>
          </View>
        ) : null}

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
              ...crew.map((m) => ({ key: m.id, label: agentTitle(m.id).toLowerCase() })),
            ].map((chip) => (
              <Pressable
                key={chip.key}
                onPress={() => setFilter(chip.key)}
                style={{
                  borderRadius: 999,
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  backgroundColor:
                    filter === chip.key ? '#4285F4' : 'rgba(255,255,255,0.08)',
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
                    agentName={agentTitle(item.agentId)}
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
        agentName={selected ? agentTitle(selected.item.agentId) : ''}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}
