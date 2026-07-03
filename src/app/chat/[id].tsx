import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApprovalCard } from '@/components/ui/approval-card';
import { CrewSwitch } from '@/components/ui/crew-switch';
import { MeshBg } from '@/components/ui/mesh-bg';
import { MessageBubble } from '@/components/ui/message-bubble';
import { ResultCard } from '@/components/ui/result-card';
import { ScheduleCard } from '@/components/ui/schedule-card';
import { SuggestionChips } from '@/components/ui/suggestion-chips';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { WeekStrip } from '@/components/ui/week-strip';
import { useAppStore } from '@/store/app-store';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '@/theme/theme';

/** Full-screen conversation view for one thread (pushed over the tabs). */
export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getThread,
    typingThreadId,
    sendMessage,
    resolveChatApproval,
    calendarScan,
    calendarDays,
    bookScheduleSlot,
    crewSelected,
    crewManual,
    crewBusy,
    selectCrew,
  } = useAppStore();
  const [draft, setDraft] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
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

      {/* Slim header: back pinned left, crew switch truly centered on the
          screen (not just centered in the space left of the arrow) — a
          matching invisible spacer on the right balances the arrow's width. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        }}>
        <View style={{ width: 42, alignItems: 'flex-start' }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => ({ padding: spacing.xs, opacity: pressed ? 0.5 : 1 })}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <CrewSwitch
            selected={crewSelected}
            manual={crewManual}
            busy={crewBusy}
            onSelect={selectCrew}
          />
        </View>
        <View style={{ width: 42 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              padding: spacing.lg,
              // make room under the week strip overlay
              paddingTop: spacing.lg + (calendarScan ? 150 : 0),
              paddingBottom: spacing.md,
            }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}>
            {thread?.messages.map((m) => (
              <View key={m.id}>
                {m.terminalLog ? (
                  <View style={{ marginBottom: spacing.sm }}>
                    {m.terminalLog.map((line, i) => (
                      <Text
                        key={i}
                        style={{
                          fontFamily: 'Menlo',
                          fontSize: 10,
                          lineHeight: 14,
                          color: colors.textTertiary,
                        }}>
                        {line}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <MessageBubble from={m.from} text={m.text}>
                {m.approval ? (
                  <ApprovalCard
                    compact
                    approval={m.approval}
                    onApprove={(a) => resolveChatApproval(thread.id, m.id, a, true)}
                    onDeny={(a) => resolveChatApproval(thread.id, m.id, a, false)}
                    onReview={(a) => router.push(`/approval/${a.id}`)}
                  />
                ) : null}
                {m.schedule ? (
                  <ScheduleCard
                    schedule={m.schedule}
                    weekday={
                      calendarDays.find((d) => d.date === m.schedule?.date)?.weekday ?? ''
                    }
                    events={calendarDays.find((d) => d.date === m.schedule?.date)?.events ?? []}
                    onBook={(slot) => bookScheduleSlot(thread.id, m.id, slot)}
                  />
                ) : null}
                {m.result ? <ResultCard result={m.result} /> : null}
                {m.suggestions ? (
                  <SuggestionChips
                    suggestions={m.suggestions}
                    onPick={(text) => sendMessage(thread.id, text)}
                  />
                ) : null}
                </MessageBubble>
              </View>
            ))}
            {isTyping ? <TypingIndicator /> : null}
          </ScrollView>

          {/* Week strip: drops in below the chips while Scheduler scans */}
          {calendarScan ? (
            <Animated.View
              pointerEvents="none"
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              style={{
                position: 'absolute',
                top: spacing.sm,
                left: spacing.lg,
                right: spacing.lg,
                zIndex: 10,
              }}>
              <WeekStrip targetDate={calendarScan.targetDate} />
            </Animated.View>
          ) : null}

          {/* Floating list button: peek at the calendar before (or after) asking */}
          <Pressable
            onPress={() => router.push('/calendar')}
            style={({ pressed }) => ({
              position: 'absolute',
              right: spacing.lg,
              bottom: spacing.md,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
              ...shadow.card,
            })}>
            <Ionicons name="list" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Attachment popover (+ button): Camera / Photos / Files */}
        {attachOpen ? (
          <>
            <Pressable
              onPress={() => setAttachOpen(false)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }}
            />
            <Animated.View
              entering={FadeInDown.duration(160)}
              style={{
                position: 'absolute',
                left: spacing.lg + 6,
                bottom: 64,
                zIndex: 21,
                minWidth: 180,
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                paddingVertical: spacing.xs,
                ...shadow.card,
              }}>
              {(
                [
                  { icon: 'camera-outline', label: 'Camera' },
                  { icon: 'image-outline', label: 'Photos' },
                  { icon: 'folder-outline', label: 'Files' },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    setAttachOpen(false);
                    Alert.alert('Coming soon');
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    opacity: pressed ? 0.5 : 1,
                  })}>
                  <Ionicons name={item.icon} size={18} color={colors.text} />
                  <Text
                    style={{
                      fontSize: fontSize.body,
                      fontFamily: fontFamily.regular,
                      color: colors.text,
                    }}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          </>
        ) : null}


        {/* Input: one island-glass pill (same material family as the crew bar) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            marginTop: spacing.xs,
            paddingLeft: spacing.md,
            paddingRight: 4,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.85)',
          }}>
            <Pressable
              onPress={() => setAttachOpen((v) => !v)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Ionicons name="add" size={24} color={colors.text} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onFocus={() => setAttachOpen(false)}
              placeholder="Message your agent…"
              placeholderTextColor={colors.textTertiary}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                fontSize: 15,
                fontFamily: fontFamily.regular,
                color: colors.text,
              }}
              returnKeyType="send"
              onSubmitEditing={onSend}
            />
            <Pressable
              onPress={() => (draft.trim() ? onSend() : Alert.alert('Coming soon'))}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 999,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}>
              <Ionicons
                name={draft.trim() ? 'arrow-up' : 'mic'}
                size={19}
                color={colors.accentText}
              />
            </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
