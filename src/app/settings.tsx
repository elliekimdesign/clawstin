import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { ConnectionDiagram } from '@/components/ui/connection-diagram';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { MosaicDot } from '@/components/ui/mosaic-dot';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, spacing, sysColor } from '@/theme/theme';

// System settings (2026-07-12): the status popover's destination. The
// popover is the summary; this screen is where system things get DONE:
// gateway, model choice, crew door, notifications. Same aquaos desk +
// section-window chrome as every tab, so it reads as part of the OS.
const DESK = '#4E83B8';
const INK = '#16181C';
const DIM = 'rgba(22,24,28,0.6)';
const FAINT = 'rgba(22,24,28,0.42)';
const DIVIDER = 'rgba(22,24,28,0.08)';

function SettingsWindow({ title, children }: { title: string; children: ReactNode }) {
  // the folder flap hugs its title, Home's own measure pattern
  // (2026-07-17 "홈탭이랑 비슷하게")
  const [titleW, setTitleW] = useState(0);
  return (
    <View
      style={{
        // frosted folder + the board's airy 28pt rhythm; the SVG path
        // is the shape, so no clip/border on the box
        marginTop: 28,
        shadowColor: '#16181C',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
      }}>
      <FrostedGlassFill radius={16} tabWidth={titleW ? 18 + titleW + 18 : 110} />
      <View style={{ height: 26, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 }}>
        <Text
          onTextLayout={(e) => {
            const w = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
            if (w && w !== titleW) setTitleW(w);
          }}
          // NOTE: no alignSelf here — in this ROW strip it would grab
          // the vertical axis and pin the title to the flap's top
          // ("헤어라인 글씨 안 맞는" bug, 2026-07-17)
          style={{
            fontSize: 12,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.3,
            color: DIM,
          }}>
          {title}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 18, paddingBottom: 10, paddingTop: 2 }}>{children}</View>
    </View>
  );
}

/** One settings line: sans label on the left (human voice), machine
 * values on the right in the system voice. */
function Row({
  label,
  right,
  onPress,
  last,
  leading,
  dense,
  sub,
}: {
  label: string;
  right: ReactNode;
  onPress?: () => void;
  last?: boolean;
  /** optional icon slot before the label (the TOOLS rows) */
  leading?: ReactNode;
  /** tighter rhythm for long scannable lists (the ONE-SCREEN rule:
   * a list that overflows the viewport turns skimming into digging) */
  dense?: boolean;
  /** one quiet evidence line under the label — only where the case
   * is strong, so the list stays scannable */
  sub?: string;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: dense ? 9 : 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: DIVIDER,
        opacity: pressed ? 0.55 : 1,
      })}>
      {/* Home's row voice (2026-07-17 "홈탭이랑 비슷하게"): body-size
          regular labels over 11 machine values — the TASKS list's own
          calibration */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
        {leading}
        <View style={{ flexShrink: 1 }}>
          <Text style={{ color: INK, fontFamily: fontFamily.regular, fontSize: fontSize.body }}>
            {label}
          </Text>
          {sub ? (
            <Text
              numberOfLines={1}
              style={{ marginTop: 2, fontSize: 11, color: FAINT }}>
              {sub}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 }}>
        {right}
      </View>
    </Pressable>
  );
}

const TOOL_INK = 'rgba(22,24,28,0.65)';

/** Linear's mark, hand-drawn mono (2026-07-17): the circle cut from
 * diagonal rounded stripes — Ionicons has no brand glyph for it. */
function LinearMark({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <ClipPath id="lin-c">
        <Circle cx="50" cy="50" r="46" />
      </ClipPath>
      <G clipPath="url(#lin-c)" stroke={TOOL_INK} strokeWidth={13} strokeLinecap="round">
        <Line x1="8" y1="66" x2="34" y2="92" />
        <Line x1="6" y1="38" x2="62" y2="94" />
        <Line x1="20" y1="24" x2="76" y2="80" />
        <Line x1="40" y1="14" x2="86" y2="60" />
      </G>
    </Svg>
  );
}

/** Notion's mark, hand-drawn mono: the rounded page with its serif N. */
function NotionMark({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="12"
        fill="none"
        stroke={TOOL_INK}
        strokeWidth={9}
      />
      <SvgText
        x="50"
        y="70"
        fontSize="52"
        fontWeight="bold"
        fontFamily="Georgia"
        fill={TOOL_INK}
        textAnchor="middle">
        N
      </SvgText>
    </Svg>
  );
}

// The product's tool SCOPE (2026-07-17): everything the crew can
// reach, connected or not — Settings is where that state is visible.
// Linear/Notion wear their hand-drawn marks above; the rest use
// Ionicons, all in the same mono ink as the chat tool rail.
// evidence sublines ride only the STRONGEST 2 cases ("근거 강한 상위
// 2~3개만") — every row with one would be noise; two builds hierarchy
const TOOLS = [
  { name: 'Calendar', icon: 'calendar-clear-outline', connected: true, why: undefined },
  { name: 'Gmail', icon: 'mail-outline', connected: true, why: undefined },
  { name: 'GitHub', icon: 'logo-github', connected: true, why: undefined },
  {
    name: 'Slack',
    icon: 'logo-slack',
    connected: false,
    why: "You've mentioned Slack in 3 tasks",
  },
  {
    name: 'Linear',
    icon: null,
    connected: false,
    why: 'Linear issues came up in 2 PR chats',
  },
  { name: 'Notion', icon: null, connected: false, why: undefined },
  { name: 'Maps', icon: 'map-outline', connected: false, why: undefined },
  { name: 'Health', icon: 'heart-outline', connected: false, why: undefined },
] as const;

const Mono = ({ children }: { children: ReactNode }) => (
  <Text style={{ color: DIM, fontFamily: fontFamily.mono, fontSize: 11 }}>{children}</Text>
);

export default function SettingsScreen() {
  const { services, gatewayStatus } = useAppStore();
  const core = services.find((s) => s.group === 'core');
  const models = services.filter((s) => s.group === 'llm');
  const [defaultModel, setDefaultModel] = useState(models[0]?.id);
  // notification switches are local mock state for now
  const [alerts, setAlerts] = useState({ yourTurn: true, failures: true, digest: false });

  const connState =
    gatewayStatus === 'online'
      ? { word: 'Connected', color: sysColor.ready }
      : gatewayStatus === 'unstable'
        ? { word: 'Reconnecting', color: sysColor.degraded }
        : { word: 'Offline', color: sysColor.fail };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: DESK }}>
      <StatusBar style="light" />
      <ColorPanelsBg />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: 8,
          paddingBottom: 48,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => ({
              width: 30,
              height: 26,
              borderRadius: 15,
              backgroundColor: 'rgba(255,255,255,0.85)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}>
            <Ionicons name="chevron-back" size={17} color={INK} />
          </Pressable>
          <Text
            style={{
              fontSize: 20,
              fontFamily: fontFamily.bold,
              color: '#FFFFFF',
              textShadowColor: 'rgba(22,24,28,0.18)',
              textShadowRadius: 4,
            }}>
            System
          </Text>
        </View>

        <SettingsWindow title="Connection">
          {/* the section's soul: this phone talking to the Mac gateway */}
          <ConnectionDiagram status={gatewayStatus} />
          <View style={{ height: 1, backgroundColor: DIVIDER }} />
          <Row label="Gateway" right={<Mono>openclaw.local:8443</Mono>} />
          <Row label="Latency" right={<Mono>{`${core?.pingMs ?? 0}ms`}</Mono>} />
          <Row
            label="Status"
            last
            right={
              <>
                <Mono>{connState.word}</Mono>
                {/* the app's mosaic state mark (2026-07-17) */}
                <MosaicDot color={connState.color} size={8} />
              </>
            }
          />
        </SettingsWindow>

        {/* the pipe above, what flows through it here (2026-07-17):
            the tools YOUR ASKS have touched, with live state — the
            chat rail's three doors are the connected subset. ONE
            SCREEN rule: 3 Connected + the Available tail + one "More
            on your gateway" line, dense enough to fit a viewport. */}
        <SettingsWindow title="Tools">
          {TOOLS.map((t) => (
            <Row
              key={t.name}
              label={t.name}
              dense
              sub={t.why}
              leading={
                t.name === 'Linear' ? (
                  <LinearMark />
                ) : t.name === 'Notion' ? (
                  <NotionMark />
                ) : t.icon ? (
                  <Ionicons name={t.icon} size={16} color={TOOL_INK} />
                ) : null
              }
              right={
                t.connected ? (
                  <>
                    <Mono>Connected</Mono>
                    <MosaicDot color={sysColor.ready} size={8} />
                  </>
                ) : (
                  // it surfaced because an ask touched it; "Available"
                  // says "ready when you are," not "missing"
                  <Text
                    style={{ color: FAINT, fontFamily: fontFamily.mono, fontSize: 11 }}>
                    Available
                  </Text>
                )
              }
            />
          ))}
          {/* the long tail lives on the gateway — the same quiet
              in-card door every section footer wears (2026-07-17,
              floating it outside read as a stray line) */}
          <Pressable
            onPress={() => Alert.alert('Coming soon')}
            hitSlop={8}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              paddingTop: 10,
              paddingBottom: 2,
              opacity: pressed ? 0.5 : 1,
            })}>
            <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: DIM }}>
              {/* ︎ = the arrow's TEXT presentation — bare ↗ renders
                  as the boxed emoji on iOS (no-emoji rule) */}
              {'More tools on your gateway ↗︎'}
            </Text>
          </Pressable>
        </SettingsWindow>

        {/* the default model handles new chats; agents can still pick
            their own per run */}
        <SettingsWindow title="Models">
          {models.map((m, i) => (
            <Row
              key={m.id}
              label={m.name}
              last={i === models.length - 1}
              onPress={() => setDefaultModel(m.id)}
              right={
                <>
                  {m.pingMs != null ? <Mono>{`${m.pingMs}ms`}</Mono> : null}
                  {defaultModel === m.id ? (
                    <Ionicons name="checkmark" size={16} color={sysColor.accent} />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                </>
              }
            />
          ))}
        </SettingsWindow>

        {/* the CREW window is gone (2026-07-29 "네비게이션에 이미 있는건
            여기 시스템에 항목에 넣을 필요가 없을거같아"): its one row just
            pushed the Crew TAB, which is already one tap away in the nav
            bar. Settings is for what has no other home. */}

        <SettingsWindow title="Notifications">
          <Row
            label="Your turn alerts"
            right={
              <Switch
                value={alerts.yourTurn}
                onValueChange={(v) => setAlerts((a) => ({ ...a, yourTurn: v }))}
                trackColor={{ true: sysColor.accent }}
              />
            }
          />
          <Row
            label="Run failures"
            right={
              <Switch
                value={alerts.failures}
                onValueChange={(v) => setAlerts((a) => ({ ...a, failures: v }))}
                trackColor={{ true: sysColor.accent }}
              />
            }
          />
          <Row
            label="Daily digest"
            last
            right={
              <Switch
                value={alerts.digest}
                onValueChange={(v) => setAlerts((a) => ({ ...a, digest: v }))}
                trackColor={{ true: sysColor.accent }}
              />
            }
          />
        </SettingsWindow>
      </ScrollView>
    </SafeAreaView>
  );
}
