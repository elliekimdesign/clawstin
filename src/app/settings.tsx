import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { ConnectionDiagram } from '@/components/ui/connection-diagram';
import { AcidGlassFill } from '@/components/ui/window-fill';
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
  return (
    <View
      style={{
        // square + the board's airy 28pt rhythm (2026-07-14 pass)
        marginTop: 28,
        borderRadius: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        shadowColor: '#16181C',
        shadowOpacity: 0.07,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
      }}>
      <AcidGlassFill effect="clear" tone="gray" />
      <View style={{ height: 26, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 }}>
        <Text
          style={{ fontSize: 11, fontFamily: fontFamily.mono, letterSpacing: 0.3, color: DIM }}>
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
}: {
  label: string;
  right: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: DIVIDER,
        opacity: pressed ? 0.55 : 1,
      })}>
      {/* compact technical voice (2026-07-16): 13 semibold labels over
          11 machine values — the Access-row calibration, app-wide now */}
      <Text style={{ color: INK, fontFamily: fontFamily.semibold, fontSize: fontSize.small }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 }}>
        {right}
      </View>
    </Pressable>
  );
}

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
            Settings
          </Text>
        </View>

        <SettingsWindow title="CONNECTION">
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
                <View
                  style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: connState.color }}
                />
              </>
            }
          />
        </SettingsWindow>

        {/* the default model handles new chats; agents can still pick
            their own per run */}
        <SettingsWindow title="MODELS">
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

        <SettingsWindow title="CREW">
          <Row
            label="Manage crew"
            last
            onPress={() => router.push('/(tabs)/crew')}
            right={<Ionicons name="chevron-forward" size={13} color={FAINT} />}
          />
        </SettingsWindow>

        <SettingsWindow title="NOTIFICATIONS">
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
