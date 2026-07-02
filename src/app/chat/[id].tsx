import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApprovalCard } from '@/components/ui/approval-card';
import { MeshBg } from '@/components/ui/mesh-bg';
import { MessageBubble } from '@/components/ui/message-bubble';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { useAppStore } from '@/store/app-store';
import { colors, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

/** Full-screen conversation view for one thread (pushed over the tabs). */
export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getThread, typingThreadId, sendMessage, resolveChatApproval } = useAppStore();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const thread = getThread(id);
  const isTyping = typingThreadId === id;

  const onSend = () => {
    if (!draft.trim() || !thread) return;
    sendMessage(thread.id, draft);
    setDraft('');
  };

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* Subtle mint aurora background */}
      <MeshBg />

      {/* Header: back + thread title */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => ({ padding: spacing.xs, opacity: pressed ? 0.5 : 1 })}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.pill,
            backgroundColor: colors.cardAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 17 }}>{thread?.emoji ?? '💬'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.text, fontSize: fontSize.bodyLg, fontWeight: fontWeight.semibold }}
            numberOfLines={1}>
            {thread?.title ?? 'Chat'}
          </Text>
          <Text style={{ color: colors.success, fontSize: fontSize.caption }}>
            {isTyping ? 'typing…' : 'OpenClaw agent'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.md }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}>
          {thread?.messages.map((m) => (
            <MessageBubble key={m.id} from={m.from} text={m.text}>
              {m.approval ? (
                <ApprovalCard
                  compact
                  approval={m.approval}
                  onApprove={(a) => resolveChatApproval(thread.id, m.id, a, true)}
                  onDeny={(a) => resolveChatApproval(thread.id, m.id, a, false)}
                  onReview={(a) => router.push(`/approval/${a.id}`)}
                />
              ) : null}
            </MessageBubble>
          ))}
          {isTyping ? <TypingIndicator /> : null}
        </ScrollView>

        {/* Input bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: 'rgba(255,255,255,0.6)',
          }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message your agent…"
            placeholderTextColor={colors.textTertiary}
            style={{
              flex: 1,
              backgroundColor: colors.cardAlt,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              fontSize: 15,
              color: colors.text,
            }}
            returnKeyType="send"
            onSubmitEditing={onSend}
          />
          <Pressable
            onPress={onSend}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 999,
              backgroundColor: draft.trim() ? colors.accent : colors.cardAlt,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}>
            <Ionicons
              name="arrow-up"
              size={22}
              color={draft.trim() ? colors.accentText : colors.textTertiary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
