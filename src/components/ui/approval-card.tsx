import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors, darkChat, fontFamily, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

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
};

type Props = {
  approval: Approval;
  onApprove: (a: Approval) => void;
  onDeny: (a: Approval) => void;
  /** for write/exec risk: open the review detail screen */
  onReview?: (a: Approval) => void;
  /** compact = used inline inside a chat bubble */
  compact?: boolean;
  /** rendered on the chat screen's dark gradient — switch to the dark palette */
  onDark?: boolean;
};

/**
 * Minimal-row approval card: small icon chip, title/detail, a plain-text
 * risk tag, and compact text buttons. read = Deny · Approve; write/exec =
 * Deny · Review → (opens the guardrail detail screen). Neutral card shell
 * (no colored risk tints/dots) — reads as structured log output, like the
 * pipeline card's plain status tags, rather than a colorful app widget.
 */
export function ApprovalCard({ approval, onApprove, onDeny, onReview, compact, onDark }: Props) {
  const risk = approval.risk ?? 'read';
  const needsReview = risk === 'write' || risk === 'exec';

  // Palette flips as one unit so the card stays coherent on either background.
  const c = onDark
    ? {
        bg: darkChat.surface,
        border: darkChat.glassBorder,
        chip: 'rgba(255,255,255,0.12)',
        text: darkChat.text,
        secondary: darkChat.textSecondary,
        tertiary: darkChat.textTertiary,
      }
    : {
        bg: compact ? colors.cardAlt : colors.card,
        border: colors.border,
        chip: '#FFFFFF',
        text: colors.text,
        secondary: colors.textSecondary,
        tertiary: colors.textTertiary,
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
      {/* Row: icon chip · title/detail · risk tag */}
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
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

      {/* Compact text buttons, right-aligned */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xl }}>
        <Pressable onPress={() => onDeny(approval)} hitSlop={8}>
          {({ pressed }) => (
            <Text
              style={{
                color: c.secondary,
                fontSize: fontSize.small,
                fontWeight: fontWeight.semibold,
                opacity: pressed ? 0.5 : 1,
              }}>
              Deny
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => (needsReview ? onReview?.(approval) : onApprove(approval))}
          hitSlop={8}>
          {({ pressed }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.5 : 1 }}>
              <Text
                style={{ color: c.text, fontSize: fontSize.small, fontWeight: fontWeight.semibold }}>
                {needsReview ? 'Review' : 'Approve'}
              </Text>
              {needsReview ? (
                <Ionicons name="arrow-forward" size={13} color={c.text} />
              ) : null}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default ApprovalCard;
