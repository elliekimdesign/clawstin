import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTOPILOT_RULES, isInactiveAgo } from '@/mock/autopilot';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, fontWeight, spacing, sysColor } from '@/theme/theme';

// aquaos sheet tokens: this sheet is the ROUTINES window opened big,
// so it wears the same silver pane + ink + mono system voice.
const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.55)';
const DIVIDER = 'rgba(22,24,28,0.08)';
const AMBER = '#9A6B1F';
const AMBER_BG = 'rgba(199,126,34,0.16)';

/** app slug -> monochrome Ionicon: the left slot answers "what does it
 * touch", so Gmail-ness / GitHub-ness scans instantly. */
const APP_ICON = {
  gmail: 'mail-outline',
  github: 'logo-github',
  drive: 'folder-outline',
  calendar: 'calendar-clear-outline',
} as const;

/** One unified row: rules and schedules share the exact same 2-line
 * anatomy so the list keeps its rhythm at any length. The left icon is
 * the APP the automation works in; scheduled-ness lives in the right
 * slot, where a small clock rides with the "Next ..." time. */
function SheetRow({
  app,
  name,
  right,
  rightClock,
  sub,
  undone,
  dimmed,
  onPress,
}: {
  app: keyof typeof APP_ICON;
  name: string;
  /** right slot: last-run recency (rules) or next run time (schedules) */
  right: string;
  /** schedules only: a small clock glyph inline before the time */
  rightClock?: boolean;
  /** exactly one muted line: the latest action / last run receipt */
  sub: string;
  undone?: number;
  dimmed?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 13,
        paddingHorizontal: spacing.xl,
        borderTopWidth: 1,
        borderTopColor: DIVIDER,
        opacity: pressed ? 0.6 : dimmed ? 0.55 : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={APP_ICON[app]} size={14} color={INK_DIM} />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: fontSize.body,
            fontWeight: fontWeight.semibold,
            color: INK,
          }}>
          {name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          {rightClock ? <Ionicons name="time-outline" size={11} color={INK_DIM} /> : null}
          <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
            {right}
          </Text>
        </View>
      </View>
      {/* the exception chip lives at the end of the sub line so long
          names never collide with it up top */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
          paddingLeft: 21,
        }}>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: INK_DIM }}>
          {sub}
        </Text>
        {undone ? (
          <View
            style={{
              backgroundColor: AMBER_BG,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}>
            <Text style={{ fontSize: 10, fontWeight: fontWeight.semibold, color: AMBER }}>
              {undone === 1 ? 'You undid 1' : `You undid ${undone}`}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * The AUTOPILOT ledger as a bottom sheet: the board never reflows; the
 * sheet brings its own scroll. Pinned summary header up top, then ONE
 * list for both kinds of autonomy. Full history is never rendered here —
 * every row opens the conversation it was born in, and the footer hands
 * off to the Logs tab.
 */
export function AutopilotSheet({
  visible,
  onClose,
  summary,
  routine,
  onSetRoutine,
  onNotNow,
}: {
  visible: boolean;
  onClose: () => void;
  /** the human trust line, e.g. "Handled 17 things without you" */
  summary: string;
  /** the inbox-summary pattern: suggested, accepted, or waved off */
  routine: 'none' | 'set' | 'dismissed';
  /** same state as YOUR TURN's Set it up; accepting anywhere resolves both */
  onSetRoutine: () => void;
  onNotNow: () => void;
}) {
  const { schedules, setLogsFilter } = useAppStore();
  const insets = useSafeAreaInsets();
  const [inactiveOpen, setInactiveOpen] = useState(false);

  const activeRules = AUTOPILOT_RULES.filter((r) => !isInactiveAgo(r.recent[0]?.ago));
  const inactiveRules = AUTOPILOT_RULES.filter((r) => isInactiveAgo(r.recent[0]?.ago));

  /** schedules drill into their one thread (deliveries live there) */
  const openThread = (threadId: string) => {
    onClose();
    router.push(`/chat/${threadId}`);
  };
  /** rules drill into Logs, pre-filtered — one screen for all history */
  const openRuleLogs = (ruleKey: string) => {
    setLogsFilter({ kind: 'rule', value: ruleKey });
    onClose();
    router.push('/activity');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* dim scrim as a full-screen layer, so the corners of the
          rounded sheet sit on dimmed board, not raw board */}
      <View style={{ flex: 1, backgroundColor: 'rgba(22,24,28,0.2)' }}>
      <Pressable onPress={onClose} style={{ flex: 1 }} />
      <View
        style={{
          backgroundColor: '#F0F1F3',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '78%',
          paddingBottom: Math.max(insets.bottom, 12),
          shadowColor: '#16181C',
          shadowOpacity: 0.2,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -8 },
          elevation: 16,
        }}>
        {/* grabber */}
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(22,24,28,0.15)',
            marginTop: 8,
          }}
        />
        {/* pinned header: the week at a glance, then the list scrolls */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fontFamily.mono,
                letterSpacing: 0.3,
                color: INK_DIM,
              }}>
              ROUTINES
            </Text>
          </View>
          <Text
            style={{
              marginTop: 8,
              fontSize: fontSize.body,
              fontWeight: fontWeight.semibold,
              color: INK,
            }}>
            {summary}
          </Text>
          {/* pattern -> proposal, question-and-answer shaped: the app
              noticed a habit and offers to take it over. Read work gets
              a routine suggestion, never a permission question. */}
          {routine === 'dismissed' ? (
            <View style={{ height: 14 }} />
          ) : routine === 'set' ? (
            <Text style={{ fontSize: 12, color: INK_DIM, marginTop: 10, marginBottom: 14 }}>
              Morning briefing runs daily at 8 AM ✓
            </Text>
          ) : (
            <View style={{ marginTop: 10, marginBottom: 14, gap: 9 }}>
              <Text style={{ fontSize: 12, color: INK_DIM }}>
                You asked for inbox summaries 3 times this week
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                <Pressable
                  onPress={onSetRoutine}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    // PRIMARY = ink black across the app
                    backgroundColor: '#121417',
                    borderRadius: 999,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  <Text
                    style={{ fontSize: 12, fontWeight: fontWeight.semibold, color: '#F6F9FE' }}>
                    Make it a routine
                  </Text>
                </Pressable>
                <Pressable onPress={onNotNow} hitSlop={8}>
                  {({ pressed }) => (
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: fontWeight.semibold,
                        color: INK_DIM,
                        opacity: pressed ? 0.5 : 1,
                      }}>
                      Not now
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {activeRules.map((rule) => (
            <SheetRow
              key={rule.name}
              app={rule.app}
              name={rule.name}
              right={`${rule.recent[0]?.ago ?? ''} ago`}
              sub={rule.recent[0]?.label ?? ''}
              undone={rule.undone}
              onPress={() => openRuleLogs(rule.key)}
            />
          ))}
          {schedules.map((sch) => (
            <SheetRow
              key={sch.id}
              app={(sch.permissionKey as keyof typeof APP_ICON) ?? 'calendar'}
              name={sch.name}
              right={`Next ${sch.cadence}`}
              rightClock
              sub={
                sch.lastRun
                  ? `Last run ${sch.lastRun.ago} ${sch.lastRun.ok ? '✓' : '✗'}`
                  : 'First run coming up'
              }
              onPress={() => openThread(sch.threadId)}
            />
          ))}

          {inactiveRules.length > 0 ? (
            <>
              <Pressable
                onPress={() => setInactiveOpen((v) => !v)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 13,
                  paddingHorizontal: spacing.xl,
                  borderTopWidth: 1,
                  borderTopColor: DIVIDER,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Text style={{ flex: 1, fontSize: fontSize.small, color: INK_DIM }}>
                  {`Paused (${inactiveRules.length})`}
                </Text>
                <Ionicons
                  name={inactiveOpen ? 'chevron-up' : 'chevron-down'}
                  size={13}
                  color={INK_DIM}
                />
              </Pressable>
              {inactiveOpen
                ? inactiveRules.map((rule) => (
                    <SheetRow
                      key={rule.name}
                      app={rule.app}
                      name={rule.name}
                      right={`${rule.recent[0]?.ago ?? ''} ago`}
                      sub={rule.recent[0]?.label ?? ''}
                      undone={rule.undone}
                      dimmed
                      onPress={() => openRuleLogs(rule.key)}
                    />
                  ))
                : null}
            </>
          ) : null}

          {/* hand-off: the sheet is a ledger, not a log viewer */}
          <Pressable
            onPress={() => {
              setLogsFilter({ kind: 'source', value: 'autopilot' });
              onClose();
              router.push('/activity');
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 14,
              paddingHorizontal: spacing.xl,
              borderTopWidth: 1,
              borderTopColor: DIVIDER,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Text
              style={{
                flex: 1,
                fontSize: fontSize.small,
                fontWeight: fontWeight.semibold,
                color: INK,
              }}>
              All activity
            </Text>
            <Ionicons name="chevron-forward" size={13} color={INK_DIM} />
          </Pressable>
        </ScrollView>
      </View>
      </View>
    </Modal>
  );
}

export default AutopilotSheet;
