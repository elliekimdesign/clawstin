import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, TextInput, View } from 'react-native';

import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import type { Draft } from '@/mock/chat';
import { darkChat, fontFamily, fontSize, radius, spacing, sysColor } from '@/theme/theme';

/**
 * Scribe's draft, reviewed in the bubble that offered it (approvals-in-chat
 * rule — never a review screen).
 *
 * SEND IS TWO BEATS, NEVER ONE (2026-08-01 "클릭하면 바로 샌딩되는게
 * 말이 안 됨"): a message leaving the phone is an outward write, so the
 * card first shows WHO it goes to — the recipient resolved from Apple
 * Contacts, face slot reserved for the real photo later — and only an
 * explicit Confirm actually sends. First tap arms, second tap sends,
 * Cancel stands down.
 *
 * Wears the SAME quiet glass as ScheduleCard (2026-07-24): every card
 * inside the conversation reads as one material.
 */
export function DraftCard({
  draft,
  onSend,
  onEditBody,
}: {
  draft: Draft;
  onSend: () => void;
  /** persists an inline rewrite of the body (2026-08-01 "드래프트 칸
   * 내에서 수정") — editing happens IN the card, not in the composer */
  onEditBody: (body: string) => void;
}) {
  const [armed, setArmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft.body);
  const arm = (v: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(160, 'easeInEaseOut', 'opacity'));
    setArmed(v);
  };
  const flipEdit = (v: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(160, 'easeInEaseOut', 'opacity'));
    if (v) setText(draft.body);
    setEditing(v);
  };
  return (
    <View
      style={{
        backgroundColor: darkChat.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: darkChat.glassBorder,
        padding: spacing.lg,
      }}>
      <Text
        style={{
          fontFamily: fontFamily.mono,
          fontSize: 10,
          letterSpacing: 1,
          color: darkChat.textTertiary,
          marginBottom: 6,
        }}>
        DRAFT
      </Text>
      {editing ? (
        // the SAME words, unlocked in place: identical type, a faint
        // well behind them so "this is editable now" reads at a glance
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          style={{
            color: darkChat.text,
            fontSize: 15,
            lineHeight: 22,
            fontFamily: fontFamily.regular,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginHorizontal: -10,
          }}
        />
      ) : (
        <Text
          style={{
            color: darkChat.text,
            fontSize: 15,
            lineHeight: 22,
            fontFamily: fontFamily.regular,
          }}>
          {draft.body}
        </Text>
      )}

      {/* WHO receives this — the contact the crew resolved, shown BEFORE
          anything leaves the phone. The face circle is the photo slot
          (real contact photo lands later). */}
      {draft.to ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: spacing.md,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 13,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            borderColor: armed ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.16)',
          }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.85)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="person" size={15} color="rgba(22,24,28,0.45)" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: darkChat.text, fontSize: 13.5, fontFamily: fontFamily.medium }}>
              {draft.to}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 9,
                letterSpacing: 0.6,
                color: darkChat.textTertiary,
              }}>
              APPLE CONTACTS · MESSAGES
            </Text>
          </View>
          {draft.sent ? (
            <Ionicons name="checkmark" size={15} color={darkChat.textTertiary} />
          ) : null}
        </View>
      ) : null}

      {draft.sent ? (
        // stamped in place: the card IS the receipt, never removed
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginTop: spacing.md,
          }}>
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
      ) : armed ? (
        // BEAT TWO: the explicit confirm — nothing has left yet
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.md,
          }}>
          <Pressable
            onPress={onSend}
            style={({ pressed }) => ({
              borderRadius: 16,
              paddingVertical: 8,
              paddingHorizontal: spacing.md,
              backgroundColor: sysColor.accent,
              opacity: pressed ? 0.85 : 1,
            })}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: fontSize.small,
                fontFamily: fontFamily.semibold,
              }}>
              {draft.to ? `Confirm, send to ${draft.to}` : 'Confirm, send it'}
            </Text>
          </Pressable>
          <Pressable onPress={() => arm(false)} hitSlop={6} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text
              style={{
                color: darkChat.textSecondary,
                fontSize: fontSize.small,
                fontFamily: fontFamily.medium,
              }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      ) : editing ? (
        // editing beats: Done keeps the rewrite, Cancel restores
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.md,
          }}>
          <Pressable
            onPress={() => {
              onEditBody(text.trim() || draft.body);
              flipEdit(false);
            }}
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
              Done
            </Text>
          </Pressable>
          <Pressable onPress={() => flipEdit(false)} hitSlop={6} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text
              style={{
                color: darkChat.textSecondary,
                fontSize: fontSize.small,
                fontFamily: fontFamily.medium,
              }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            marginTop: spacing.md,
          }}>
          {/* BEAT ONE: arming only — Edit unlocks the words right here */}
          <Pressable
            onPress={() => arm(true)}
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
              {draft.to ? `Send to ${draft.to}…` : 'Send it…'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => flipEdit(true)}
            hitSlop={6}
            style={({ pressed }) => ({
              paddingVertical: 7,
              paddingHorizontal: spacing.sm,
              opacity: pressed ? 0.6 : 1,
            })}>
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
