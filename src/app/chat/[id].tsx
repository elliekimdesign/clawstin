import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApprovalCard } from '@/components/ui/approval-card';
import { CrewSwitch } from '@/components/ui/crew-switch';
import { GlassIconButton } from '@/components/ui/glass-icon-button';
import { MeshBg } from '@/components/ui/mesh-bg';
import { MonthOverlay } from '@/components/ui/month-overlay';
import { MessageBubble } from '@/components/ui/message-bubble';
import { PipelineCard } from '@/components/ui/pipeline-card';
import { ResultCard } from '@/components/ui/result-card';
import { ScheduleCard } from '@/components/ui/schedule-card';
import { SuggestionChips } from '@/components/ui/suggestion-chips';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { WeekStrip } from '@/components/ui/week-strip';
import { useAppStore } from '@/store/app-store';
import { darkChat, fontFamily, fontSize, radius, shadow, spacing } from '@/theme/theme';

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
  const [calOpen, setCalOpen] = useState(false);
  const [crewExpanded, setCrewExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const thread = getThread(id);
  const isTyping = typingThreadId === id;

  // Keep the week strip pinned while a schedule suggestion is awaiting a
  // slot pick, so the user can reference the calendar before deciding.
  const pendingSchedule = [...(thread?.messages ?? [])]
    .reverse()
    .find((m) => m.schedule && !m.schedule.booked)?.schedule;
  const stripTarget = calendarScan?.targetDate ?? pendingSchedule?.date ?? null;

  const onSend = () => {
    if (!draft.trim() || !thread) return;
    sendMessage(thread.id, draft);
    setDraft('');
  };

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkChat.base }} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      {/* Moody slate-teal aurora background */}
      <MeshBg variant="dark" />

      {/* Slim header: back pinned left, crew switch truly centered on the
          screen (not just centered in the space left of the arrow) — a
          matching invisible spacer on the right balances the arrow's width. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}>
        {/* Side buttons hide entirely while the crew pill is expanded so the
            row can stretch to the full header width without overlapping. */}
        {!crewExpanded ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(120)}
            style={{ width: 48, alignItems: 'flex-start' }}>
            <GlassIconButton
              icon="chevron-back"
              onPress={() => router.back()}
              onDark
              iconColor={darkChat.text}
              iconSize={22}
              hitSlop={10}
            />
          </Animated.View>
        ) : null}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <CrewSwitch
            selected={crewSelected}
            manual={crewManual}
            busy={crewBusy}
            onSelect={selectCrew}
            onExpandChange={setCrewExpanded}
          />
        </View>
        {!crewExpanded ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(120)}
            style={{ width: 48, alignItems: 'flex-end' }}>
            <GlassIconButton
              icon={calOpen ? 'close' : 'calendar-clear-outline'}
              onPress={() => setCalOpen((v) => !v)}
              onDark
              iconColor={darkChat.text}
              iconSize={20}
            />
          </Animated.View>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              paddingLeft: spacing.lg,
              // right rail reserved for a future vertical element
              paddingRight: 32,
              // make room under the week strip overlay
              paddingTop: spacing.lg + (stripTarget != null ? 150 : 0),
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
                          color: darkChat.textTertiary,
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
                    onDark
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
                {m.pipeline ? <PipelineCard pipeline={m.pipeline} /> : null}
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

          {/* Week strip: drops in while Scheduler scans, then stays pinned
              (ring settled on the target date) until a slot is booked. */}
          {stripTarget != null ? (
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
              <WeekStrip targetDate={stripTarget} scanning={!!calendarScan} />
            </Animated.View>
          ) : null}

          {/* Month calendar: floats over the chat, pinned in place — the
              conversation keeps scrolling underneath. Toggled by the list
              button; technically just an absolutely-positioned sibling of
              the ScrollView, so chat scroll never moves it. */}
          {calOpen ? (
            <Animated.View
              pointerEvents="box-none"
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(220)}
              style={{
                position: 'absolute',
                top: spacing.sm,
                left: spacing.lg,
                right: spacing.lg,
                zIndex: 12,
              }}>
              <MonthOverlay days={calendarDays} />
            </Animated.View>
          ) : null}
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
                backgroundColor: darkChat.solidSurface,
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
                  <Ionicons name={item.icon} size={18} color={darkChat.text} />
                  <Text
                    style={{
                      fontSize: fontSize.body,
                      fontFamily: fontFamily.regular,
                      color: darkChat.text,
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
            backgroundColor: darkChat.glassBg,
            borderWidth: 1,
            borderColor: darkChat.glassBorder,
          }}>
            <Pressable
              onPress={() => setAttachOpen((v) => !v)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Ionicons name="add" size={24} color={darkChat.text} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onFocus={() => setAttachOpen(false)}
              placeholder="Assign a task to your crew"
              placeholderTextColor={darkChat.textTertiary}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                fontSize: 15,
                fontFamily: fontFamily.regular,
                color: darkChat.text,
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
                backgroundColor: darkChat.text,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.8 : 1,
              })}>
              <Ionicons
                name={draft.trim() ? 'arrow-up' : 'mic'}
                size={19}
                color={darkChat.onLight}
              />
            </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
