import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/app-store';
import { colors, fontFamily, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

const BRAND = '#FF4A32';
const BRAND_SOFT = 'rgba(255,74,50,0.12)';
const DANGER = '#F23F5D';
const DANGER_SOFT = 'rgba(242,63,93,0.12)';

/**
 * Review screen for a higher-risk (write/exec) approval — shows the guardrail
 * checks (policy · allowlist · your approval) before the final Approve.
 */
export default function ApprovalReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getApproval, resolveApproval } = useAppStore();
  const approval = getApproval(id);

  const resolve = (approved: boolean) => {
    if (approval) resolveApproval(approval, approved);
    router.back();
  };

  const isExec = approval?.risk === 'exec';
  const tint = isExec ? DANGER : BRAND;
  const tintSoft = isExec ? DANGER_SOFT : BRAND_SOFT;
  const showWarning = isExec || approval?.allowlisted === false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View
        style={{
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}>
        <GlassIconButton
          icon="chevron-back"
          onPress={() => router.back()}
          iconColor={colors.text}
          iconSize={22}
          hitSlop={10}
        />
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            color: colors.text,
            fontSize: fontSize.bodyLg,
            fontWeight: fontWeight.semibold,
            marginRight: 44,
          }}>
          Review request
        </Text>
      </View>

      {approval == null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>This request was already resolved.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
            {/* Title block */}
            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radius.md,
                  backgroundColor: tintSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name={approval.icon} size={24} color={tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: fontSize.title,
                    fontFamily: fontFamily.semibold,
                  }}>
                  {approval.title}
                </Text>
                <Text
                  style={{ color: colors.textSecondary, fontSize: fontSize.body, marginTop: 3, lineHeight: 20 }}>
                  {approval.detail}
                </Text>
              </View>
            </View>

            {/* Warning banner for exec / not-allowlisted */}
            {showWarning ? (
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.sm,
                  backgroundColor: DANGER_SOFT,
                  borderRadius: radius.md,
                  padding: spacing.md,
                }}>
                <Ionicons name="warning" size={18} color={DANGER} />
                <Text style={{ flex: 1, color: DANGER, fontSize: fontSize.small, lineHeight: 19 }}>
                  {isExec
                    ? 'This runs a command on your host. Review it carefully before approving.'
                    : 'This action is not on your allowlist. Approve only if you trust it.'}
                </Text>
              </View>
            ) : null}

            {/* Command block (exec only) */}
            {approval.command ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={{ color: colors.textTertiary, fontSize: fontSize.caption, fontWeight: fontWeight.semibold, letterSpacing: 0.5 }}>
                  COMMAND
                </Text>
                <View
                  style={{
                    backgroundColor: colors.cardAlt,
                    borderRadius: radius.md,
                    padding: spacing.md,
                  }}>
                  <Text style={{ fontFamily: 'Roboto Mono', color: colors.text, fontSize: fontSize.body }}>
                    {approval.command}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Guardrail checklist */}
            <View style={{ gap: spacing.sm }}>
              <Text style={{ color: colors.textTertiary, fontSize: fontSize.caption, fontWeight: fontWeight.semibold, letterSpacing: 0.5 }}>
                GUARDRAILS
              </Text>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <GuardRow
                  label="Policy"
                  value={approval.policy ?? 'Needs your approval'}
                  ok={approval.policy !== 'Not in allowlist'}
                  first
                />
                <GuardRow
                  label="Allowlist"
                  value={approval.allowlisted ? 'In allowlist' : 'Not in allowlist'}
                  ok={!!approval.allowlisted}
                />
                <GuardRow label="Your approval" value="Waiting for you" pending />
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              padding: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
            }}>
            <Pressable
              onPress={() => resolve(false)}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.cardAlt,
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text style={{ color: colors.textSecondary, fontWeight: fontWeight.semibold, fontSize: fontSize.bodyLg }}>
                Deny
              </Text>
            </Pressable>
            <Pressable
              onPress={() => resolve(true)}
              style={({ pressed }) => ({
                flex: 1.4,
                alignItems: 'center',
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                backgroundColor: isExec ? DANGER : colors.accent,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text style={{ color: '#FFFFFF', fontWeight: fontWeight.semibold, fontSize: fontSize.bodyLg }}>
                {isExec ? 'Approve & run' : 'Approve'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function GuardRow({
  label,
  value,
  ok,
  pending,
  first,
}: {
  label: string;
  value: string;
  ok?: boolean;
  pending?: boolean;
  first?: boolean;
}) {
  const icon = pending ? 'ellipse-outline' : ok ? 'checkmark-circle' : 'alert-circle';
  const color = pending ? colors.textTertiary : ok ? colors.success : DANGER;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.divider,
      }}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={{ flex: 1, color: colors.text, fontSize: fontSize.body }}>{label}</Text>
      <Text style={{ color, fontSize: fontSize.small, fontWeight: fontWeight.medium }}>{value}</Text>
    </View>
  );
}
