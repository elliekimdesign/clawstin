import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import type { Draft } from '@/mock/chat';
import { darkChat, fontFamily, fontSize, radius, spacing } from '@/theme/theme';

/**
 * Scribe's draft, reviewed in the bubble that offered it (approvals-in-chat
 * rule — never a review screen).
 *
 * Wears the SAME quiet glass as ScheduleCard (2026-07-24 "나머지 카드나
 * 배경을 이정도로"): darkChat.surface + the glass hairline, so every card
 * that arrives inside the conversation reads as one material. The white
 * near-solid panel it started with belonged to the pinned mast, whose job is
 * to block the scroll — an in-thread card has nothing to hide, so it lets
 * the desk blue through and speaks in the white voice like every other reply.
 */
export function DraftCard({
  draft,
  onSend,
  onEdit,
}: {
  draft: Draft;
  onSend: () => void;
  onEdit: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: darkChat.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: darkChat.glassBorder,
        padding: spacing.lg,
      }}>
      {draft.to ? (
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 10,
            letterSpacing: 1,
            color: darkChat.textTertiary,
            marginBottom: 6,
          }}>
          {`TO ${draft.to.toUpperCase()}`}
        </Text>
      ) : null}
      <Text
        style={{
          color: darkChat.text,
          fontSize: 15,
          lineHeight: 22,
          fontFamily: fontFamily.regular,
        }}>
        {draft.body}
      </Text>

      {draft.sent ? (
        // stamped in place: the card IS the receipt, never removed
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginTop: spacing.md,
          }}>
          {/* the white voice, not sysColor.doneDim — that token is dark ink
              for LIGHT surfaces, and this card is glass on the blue desk */}
          <Ionicons name="checkmark" size={14} color={darkChat.textTertiary} />
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              letterSpacing: 0.6,
              color: darkChat.textTertiary,
            }}>
            {draft.to ? `Sent to ${draft.to}` : 'Sent'}
          </Text>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            marginTop: spacing.md,
          }}>
          {/* Send is the action; Edit hands the words to the composer so
              rewriting happens where typing already happens */}
          <Pressable
            onPress={onSend}
            style={({ pressed }) => ({
              borderRadius: 16,
              overflow: 'hidden',
              paddingVertical: 7,
              paddingHorizontal: spacing.md,
              opacity: pressed ? 0.85 : 1,
            })}>
            <FrostedGlassFill flat radius={16} tint="rgba(255,255,255,0.92)" />
            <Text
              style={{
                color: darkChat.onLight,
                fontSize: fontSize.small,
                fontFamily: fontFamily.semibold,
              }}>
              {draft.to ? `Send to ${draft.to}` : 'Send it'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onEdit}
            hitSlop={6}
            style={({ pressed }) => ({
              paddingVertical: 7,
              paddingHorizontal: spacing.sm,
              opacity: pressed ? 0.6 : 1,
            })}>
            {/* the secondary action speaks the white voice — the Send pill
                keeps its dark ink because it has its own white fill */}
            <Text
              style={{
                color: darkChat.textSecondary,
                fontSize: fontSize.small,
                fontFamily: fontFamily.medium,
              }}>
              Edit
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default DraftCard;
