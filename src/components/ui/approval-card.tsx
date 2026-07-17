import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { brandBlue, colors, darkChat, fontFamily, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

/** Risk tier — drives how much friction the approval needs. */
export type RiskLevel = 'read' | 'write' | 'exec';

export type Approval = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  /** which permission key this maps to (e.g. 'gmail'), if any */
  permissionKey?: string;
  /** risk tier: read = inline approve, write/exec = review first. Default read. */
  risk?: RiskLevel;
  /** the host command that would run (exec only). */
  command?: string;
  /** guardrail: policy verdict text (e.g. "Needs your approval"). */
  policy?: string;
  /** guardrail: whether this action is on the allowlist. */
  allowlisted?: boolean;
  /** display age; multi-day = soft-aged (sinks and dims, never deleted) */
  age?: string;
  /** the concrete things being acted on — rendered as rows in the bubble
   * so the ask always shows WHAT it touches, not just a title */
  items?: { label: string; detail?: string }[];
  /** approve button copy, action-specific ("Merge 3", "Move it") */
  actionLabel?: string;
  /** reject button copy, action-specific ("Pick another time") — falls
   * back to "Deny" when unset */
  denyLabel?: string;
  /** overrides the derived `permissionKey RISK` scope caption entirely,
   * for asks that touch more than one tool at once ("GitHub READ ·
   * Calendar WRITE") — SCOPE_NAME can only ever name one tool */
  scopeOverride?: string;
  /** short receipt stamped on the card after approval ("Merged successfully") */
  receipt?: string;
  /** the chat thread that hosts this ask — approvals RESOLVE in chat */
  threadId?: string;
  /** Receipt model: answering NEVER removes the card. It stays as the
   * permanent record (dimmed), and the button row becomes this stamp —
   * GitHub's purple "Merged" badge, in our grammar. */
  resolved?: 'approved' | 'denied';
};

/** permissionKey → the tool name shown in the scope caption. */
const SCOPE_NAME: Record<string, string> = {
  contacts: 'Contacts',
  calendar: 'Calendar',
  github: 'Devtools',
  gmail: 'Gmail',
};

type Props = {
  approval: Approval;
  onApprove: (a: Approval) => void;
  onDeny: (a: Approval) => void;
  /** compact = used inline inside a chat bubble */
  compact?: boolean;
  /** rendered on the chat screen's dark gradient — switch to the dark palette */
  onDark?: boolean;
};

/**
 * Approval bubble content — approvals live and RESOLVE inside the chat,
 * never on a separate review screen. Two shapes:
 * - rich task ask (`items` set): the bubble text is the question, so the
 *   card is just the payload — item rows, a mono scope caption
 *   ("Contacts · WRITE"), and Deny / action-label buttons.
 * - permission ask (no items, e.g. "Access Gmail"): keeps the small
 *   icon-chip header row. Neutral shell either way — structured log
 *   output, not a colorful widget.
 */
export function ApprovalCard({ approval, onApprove, onDeny, compact, onDark }: Props) {
  const risk = approval.risk ?? 'read';
  const scope =
    approval.scopeOverride ??
    (approval.permissionKey
      ? `${SCOPE_NAME[approval.permissionKey] ?? approval.permissionKey}  ${risk.toUpperCase()}`
      : null);

  // Palette flips as one unit so the card stays coherent on either background.
  const c = onDark
    ? {
        bg: darkChat.surface,
        border: darkChat.glassBorder,
        chip: 'rgba(255,255,255,0.12)',
        text: darkChat.text,
        secondary: darkChat.textSecondary,
        tertiary: darkChat.textTertiary,
        // approval stamps speak OUR light blue (the crew's signature),
        // not the generic mint
        ok: brandBlue,
        // fixed white pill (2026-07-16 fix): this exploited
        // darkChat.text's OLD white value as a solid button fill —
        // that token now means "body ink," not "light surface"
        btnBg: '#FFFFFF',
        btnText: darkChat.onLight,
      }
    : {
        bg: compact ? colors.cardAlt : colors.card,
        border: colors.border,
        chip: '#FFFFFF',
        text: colors.text,
        secondary: colors.textSecondary,
        tertiary: colors.textTertiary,
        ok: colors.success,
        btnBg: colors.text,
        btnText: '#FFFFFF',
      };

  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: radius.md,
        borderWidth: compact && !onDark ? 0 : 1,
        borderColor: c.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
      }}>
      {approval.items ? (
        // Rich task ask: the bubble text already asked the question, so
        // the card carries the payload — what exactly gets touched.
        // Once resolved it dims a touch: done, but still on the record.
        <View style={{ gap: 6, opacity: approval.resolved ? 0.6 : 1 }}>
          {approval.items.map((it, i) => (
            <View
              key={i}
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
                {it.label}
              </Text>
              {it.detail ? (
                <Text
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 11,
                    color: c.secondary,
                    flexShrink: 0,
                  }}
                  numberOfLines={1}>
                  {it.detail}
                </Text>
              ) : null}
            </View>
          ))}
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
        </View>
      ) : (
        // Permission ask: icon chip · title/detail · risk tag
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.md,
            alignItems: 'center',
            opacity: approval.resolved ? 0.6 : 1,
          }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: radius.sm,
              backgroundColor: c.chip,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name={approval.icon} size={15} color={c.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: c.text, fontSize: fontSize.body, fontWeight: fontWeight.semibold }}
              numberOfLines={1}>
              {approval.title}
            </Text>
            <Text
              style={{ color: c.secondary, fontSize: fontSize.small, marginTop: 1 }}
              numberOfLines={1}>
              {approval.detail}
            </Text>
          </View>
          {risk !== 'read' ? (
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 11,
                letterSpacing: 0.4,
                color: c.tertiary,
              }}>
              [{risk.toUpperCase()}]
            </Text>
          ) : null}
        </View>
      )}

      {approval.resolved ? (
        // The stamp: buttons gave way to the outcome; the card above is
        // the receipt and never disappears.
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 12,
              color: approval.resolved === 'approved' ? c.ok : c.tertiary,
            }}>
            {approval.resolved === 'approved'
              ? `✓ ${approval.receipt ?? 'Approved'}`
              : '✗ Denied'}
          </Text>
        </View>
      ) : (
        // Ghost Deny + the approve action as a solid pill — the SAME
        // white chip grammar as the schedule card's "Book 9:00 AM".
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: spacing.xl,
          }}>
          <Pressable onPress={() => onDeny(approval)} hitSlop={8}>
            {({ pressed }) => (
              <Text
                style={{
                  color: c.secondary,
                  fontSize: fontSize.small,
                  fontWeight: fontWeight.semibold,
                  opacity: pressed ? 0.5 : 1,
                }}>
                {approval.denyLabel ?? 'Deny'}
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => onApprove(approval)}
            hitSlop={8}
            style={({ pressed }) => ({
              backgroundColor: c.btnBg,
              borderRadius: radius.pill,
              paddingVertical: 7,
              paddingHorizontal: spacing.md,
              opacity: pressed ? 0.85 : 1,
            })}>
            <Text
              style={{
                color: c.btnText,
                fontSize: fontSize.small,
                fontFamily: fontFamily.semibold,
              }}>
              {approval.actionLabel ?? 'Approve'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default ApprovalCard;
