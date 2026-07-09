import { Pressable, Text, View } from 'react-native';
import { darkChat, fontFamily, fontSize, fontWeight, radius, spacing } from '@/theme/theme';
import type { ScheduleProposal } from '@/mock/schedules';

/** permissionKey -> tool name, same language as ApprovalCard's scope. */
const SCOPE_NAME: Record<string, string> = {
  contacts: 'Contacts',
  calendar: 'Calendar',
  github: 'Devtools',
  gmail: 'Gmail',
};

type Props = {
  proposal: ScheduleProposal;
  onRunOnce: (p: ScheduleProposal) => void;
  onSchedule: (p: ScheduleProposal) => void;
};

/**
 * Schedule proposal bubble content: the agent's structured read-back of a
 * natural-language recurring ask ("summarize my inbox every day at 2pm").
 * Constraint-as-structure: name, cadence, work and scope are FIELDS, not
 * prose buried in a prompt. The primary action is a TEST RUN ("Run once
 * now") so trust is calibrated before autonomy is granted; "Schedule"
 * confirms. Receipt model: scheduling stamps the card in place, it never
 * disappears. Editing happens in conversation, so there is no edit UI.
 */
export function ScheduleProposalCard({ proposal, onRunOnce, onSchedule }: Props) {
  const c = {
    bg: darkChat.surface,
    border: darkChat.glassBorder,
    text: darkChat.text,
    secondary: darkChat.textSecondary,
    tertiary: darkChat.textTertiary,
    ok: darkChat.success,
    btnBg: darkChat.text,
    btnText: darkChat.onLight,
  };
  const scope = proposal.permissionKey
    ? `${SCOPE_NAME[proposal.permissionKey] ?? proposal.permissionKey} · ${proposal.scope}`
    : null;

  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
      }}>
      <View style={{ gap: 6, opacity: proposal.resolved ? 0.6 : 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
          }}>
          <Text
            style={{ color: c.text, fontSize: fontSize.body, fontWeight: fontWeight.semibold }}
            numberOfLines={1}>
            {proposal.name}
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              letterSpacing: 0.4,
              color: c.tertiary,
            }}>
            SCHEDULE
          </Text>
        </View>
        {/* the fields: when it runs, what each run does */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
          }}>
          <Text
            style={{
              color: c.text,
              fontSize: fontSize.small,
              fontWeight: fontWeight.semibold,
              flexShrink: 1,
            }}
            numberOfLines={1}>
            {proposal.what}
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              color: c.secondary,
              flexShrink: 0,
            }}
            numberOfLines={1}>
            {proposal.cadence}
          </Text>
        </View>
        {scope ? (
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              letterSpacing: 0.4,
              color: c.tertiary,
              marginTop: 2,
            }}>
            {scope}
          </Text>
        ) : null}
        {proposal.testRan ? (
          // the pre-autonomy calibration: the test run's result sits in
          // this same thread, right below the card
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              color: c.tertiary,
            }}>
            {'↳ test run below'}
          </Text>
        ) : null}
      </View>

      {proposal.resolved ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 12,
              color: c.ok,
            }}>
            {`✓ Scheduled · ${proposal.cadence}`}
          </Text>
        </View>
      ) : (
        // approval-row grammar: ghost secondary + solid primary. The
        // test run is the primary because trust comes before autonomy.
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: spacing.xl,
          }}>
          <Pressable onPress={() => onSchedule(proposal)} hitSlop={8}>
            {({ pressed }) => (
              <Text
                style={{
                  color: c.secondary,
                  fontSize: fontSize.small,
                  fontWeight: fontWeight.semibold,
                  opacity: pressed ? 0.5 : 1,
                }}>
                Schedule
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => onRunOnce(proposal)}
            disabled={proposal.testRan}
            hitSlop={8}
            style={({ pressed }) => ({
              backgroundColor: c.btnBg,
              borderRadius: radius.pill,
              paddingVertical: 7,
              paddingHorizontal: spacing.md,
              opacity: proposal.testRan ? 0.4 : pressed ? 0.85 : 1,
            })}>
            <Text
              style={{
                color: c.btnText,
                fontSize: fontSize.small,
                fontFamily: fontFamily.semibold,
              }}>
              Run once now
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default ScheduleProposalCard;
