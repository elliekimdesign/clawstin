import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

// Brand accent (orange) — used only for the tiny risk dot.
const BRAND = '#FF4A32';
const DANGER = '#F23F5D';

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
};

// Tiny risk dot color per tier (muted tone — the dot is the only color).
const RISK_DOT = { read: colors.textTertiary, write: BRAND, exec: DANGER } as const;
// Soft-tint tile background per tier (color-block look, buttons stay readable).
const RISK_BG = {
  read: '#F2EFE9',
  write: 'rgba(255,74,50,0.10)',
  exec: 'rgba(242,63,93,0.10)',
} as const;

/**
 * Minimal-row approval card (Figma A1 + A2 combo): small icon chip, title/detail,
 * a tiny risk dot, and compact text buttons. read = Deny · Approve; write/exec =
 * Deny · Review → (opens the guardrail detail screen).
 */
export function ApprovalCard({ approval, onApprove, onDeny, onReview, compact }: Props) {
  const risk = approval.risk ?? 'read';
  const needsReview = risk === 'write' || risk === 'exec';

  return (
    <View
      style={{
        backgroundColor: compact ? colors.cardAlt : RISK_BG[risk],
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
      }}>
      {/* Row: icon chip · title/detail · risk dot */}
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: radius.sm,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name={approval.icon} size={15} color={colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.text, fontSize: fontSize.body, fontWeight: fontWeight.semibold }}
            numberOfLines={1}>
            {approval.title}
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: fontSize.small, marginTop: 1 }}
            numberOfLines={1}>
            {approval.detail}
          </Text>
        </View>
        <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: RISK_DOT[risk] }} />
      </View>

      {/* Compact text buttons, right-aligned */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xl }}>
        <Pressable onPress={() => onDeny(approval)} hitSlop={8}>
          {({ pressed }) => (
            <Text
              style={{
                color: colors.textSecondary,
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
                style={{ color: colors.text, fontSize: fontSize.small, fontWeight: fontWeight.semibold }}>
                {needsReview ? 'Review' : 'Approve'}
              </Text>
              {needsReview ? (
                <Ionicons name="arrow-forward" size={13} color={colors.text} />
              ) : null}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default ApprovalCard;
