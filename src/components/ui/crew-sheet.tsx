import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CrewMember } from '@/mock/crew';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, sysColor } from '@/theme/theme';

import { CREW_ACCENT, CrewPixel } from './crew-pixel';
import { FrostedGlassFill } from './frosted-glass-fill';
import { MosaicDot } from './mosaic-dot';
import { PixelText } from './pixel-text';
import { RisingSheet } from './rising-sheet';

const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.55)';
const INK_FAINT = 'rgba(22,24,28,0.4)';
const DIVIDER = 'rgba(22,24,28,0.08)';

/** mono section label in the Activity feed's day-group voice */
function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 4,
        fontSize: 11,
        fontFamily: fontFamily.mono,
        letterSpacing: 0.3,
        color: INK_FAINT,
      }}>
      {children}
    </Text>
  );
}

/**
 * The crew card's BACK SIDE as a rising folder (2026-07-20): the HR
 * file. Not a repeat of the card face but proof of its promise — who
 * (header anchor), what they may touch (standing ACCESS, the agent-level
 * half of the approval cards' transparency story), what they've done
 * (recent runs, doors to their threads), what they run on (model line).
 * Every piece reassembles an existing system: approval scope grammar,
 * the Activity filter, the settings model list, the TaskSheet shell.
 */
export function CrewSheet({
  member,
  visible,
  onClose,
}: {
  /** stays set while the sheet slides out, so content survives the exit */
  member: CrewMember | null;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { activity, threads, services, defaultModelId } = useAppStore();
  const [titleW, setTitleW] = useState(0);

  if (!member) return null;

  const roleTag = member.roleWord;
  const recent = activity.filter((a) => a.agentId === member.id).slice(0, 4);
  const modelName =
    services.find((s) => s.id === defaultModelId)?.name ?? 'Claude Sonnet 5';

  const openThread = (threadId: string) => {
    onClose();
    router.push(`/chat/${threadId}`);
  };

  return (
    <RisingSheet visible={visible} onClose={onClose}>
      <View
        style={{
          marginHorizontal: 10,
          marginBottom: Math.max(insets.bottom, 10),
          maxHeight: '78%',
          shadowColor: '#16181C',
          shadowOpacity: 0.2,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -8 },
          elevation: 16,
        }}>
        <FrostedGlassFill
          radius={16}
          tint="rgba(255,255,255,0.8)"
          tabWidth={titleW ? 18 + titleW + 18 : 110}
        />
        {/* the flap names the file by ROLE — the card face already
            introduced the person */}
        <View style={{ height: 26, justifyContent: 'center', paddingHorizontal: 18 }}>
          <Text
            onTextLayout={(e) => {
              const w = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
              if (w !== titleW) setTitleW(w);
            }}
            style={{
              alignSelf: 'flex-start',
              fontSize: 12,
              fontFamily: fontFamily.mono,
              letterSpacing: 0.3,
              color: INK_DIM,
            }}>
            {roleTag}
          </Text>
        </View>

        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 6 }}>
          {/* ① header: the card face enlarged — an anchor, no new info */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingHorizontal: 18,
              paddingTop: 12,
            }}>
            <CrewPixel id={member.id} size={56} />
            <View style={{ gap: 6, flexShrink: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <PixelText text={member.name.toUpperCase()} cell={1.8} color={INK} led />
                <MosaicDot color={CREW_ACCENT[member.id] ?? INK_DIM} size={8} />
              </View>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
                {`${member.roleWord} ${member.roleLine}`}
              </Text>
            </View>
          </View>
          <Text
            style={{
              paddingHorizontal: 18,
              marginTop: 10,
              fontSize: 12,
              lineHeight: 17,
              color: INK_DIM,
            }}>
            {member.desc}
          </Text>

          {/* ② standing permissions — the core of the file. Task-level
              scope lives on approval cards; THIS is the employee's
              permanent clearance line. WRITE rows carry the weight. */}
          <SectionLabel>Access</SectionLabel>
          {member.access.map((g, idx) => (
            <View key={g.tool}>
              {idx > 0 ? (
                <View style={{ height: 1, marginHorizontal: 18, backgroundColor: DIVIDER }} />
              ) : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 18,
                  paddingVertical: 11,
                }}>
                <Ionicons
                  name={g.icon}
                  size={15}
                  color={g.scope === 'WRITE' ? INK : INK_DIM}
                />
                {/* the approval cards' scope grammar, verbatim */}
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fontFamily.mono,
                    fontSize: 11,
                    letterSpacing: 0.4,
                    color: g.scope === 'WRITE' ? INK : INK_DIM,
                  }}>
                  {g.tool}
                  <Text style={{ color: g.scope === 'WRITE' ? sysColor.action : INK_DIM }}>
                    {`  ${g.scope}`}
                  </Text>
                </Text>
                {g.scope === 'WRITE' ? <MosaicDot color={sysColor.action} size={6} /> : null}
              </View>
            </View>
          ))}

          {/* ③ recent runs: this member's rows only, doors to threads */}
          <SectionLabel>Recent runs</SectionLabel>
          {recent.length === 0 ? (
            <Text
              style={{
                paddingHorizontal: 18,
                paddingVertical: 12,
                fontSize: 10,
                fontFamily: fontFamily.mono,
                color: INK_FAINT,
              }}>
              no runs yet
            </Text>
          ) : (
            recent.map((a, idx) => (
              <View key={a.id}>
                {idx > 0 ? (
                  <View
                    style={{ height: 1, marginHorizontal: 18, backgroundColor: DIVIDER }}
                  />
                ) : null}
                <Pressable
                  onPress={() => openThread(a.threadId)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 18,
                    paddingVertical: 11,
                    opacity: pressed ? 0.5 : 1,
                  })}>
                  <View style={{ width: 14, alignItems: 'flex-start' }}>
                    <MosaicDot
                      color={
                        a.status === 'needs_approval'
                          ? sysColor.action
                          : 'rgba(22,24,28,0.35)'
                      }
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: INK,
                      fontSize: fontSize.body,
                      fontFamily: fontFamily.regular,
                    }}>
                    {threads.find((t) => t.id === a.threadId)?.title ?? a.prompt}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
                    {a.ago}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
          {/* the drilldown rule: Activity + filter receives everything —
              this door opens the tab with the member's name in the
              existing search, no new screen */}
          <Pressable
            onPress={() => {
              onClose();
              router.navigate({ pathname: '/(tabs)/chat', params: { q: member.name } });
            }}
            hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 18,
              paddingTop: 6,
              paddingBottom: 14,
              opacity: pressed ? 0.5 : 1,
            })}>
            <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
              all activity
            </Text>
            <Ionicons
              name="chevron-forward"
              size={11}
              color={INK_DIM}
              style={{ marginLeft: 2 }}
            />
          </Pressable>

          {/* ④ the machine-room line, dim on purpose: power users only */}
          <View style={{ height: 1, marginHorizontal: 18, backgroundColor: DIVIDER }} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 18,
              paddingVertical: 12,
            }}>
            <Text
              style={{ flex: 1, fontSize: 10, fontFamily: fontFamily.mono, color: INK_FAINT }}>
              {`Runs on ${modelName}`}
            </Text>
            <Pressable
              hitSlop={10}
              onPress={() => {
                onClose();
                router.push('/settings');
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.5 : 1,
              })}>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
                Change
              </Text>
              <Ionicons
                name="chevron-forward"
                size={11}
                color={INK_DIM}
                style={{ marginLeft: 2 }}
              />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </RisingSheet>
  );
}

export default CrewSheet;
