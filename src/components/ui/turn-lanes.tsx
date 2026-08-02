import { useState } from 'react';
import { LayoutAnimation, LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import type { ChatMessage } from '@/mock/chat';
import { fontFamily, sysColor } from '@/theme/theme';

/**
 * BRANCH LANES (2026-08-01): one turn of the agentic loop, built from
 * the Figma G-series storyboard. The ask splits into typed lanes —
 * RESEARCH / ACTION / PROPOSAL — and merges back to a settle point.
 *
 * The four organizing rules the storyboard established:
 *   1 · a lane's face is MAX two precise lines + a count; long
 *       answers live behind the count, never on the face
 *   2 · an opened lane shows DATA ROWS, not paragraphs, and its pick
 *       feeds the action button directly
 *   3 · (contract-before-run lives in the approval grammar; the Book
 *       button here IS the user saying go)
 *   4 · a settled turn folds to ONE receipt line + follow-up chips —
 *       history is receipts, so the thread never drowns
 *
 * Reuse is the loop itself: every ask mints this same component.
 */

const INK = '#16181C';
const DIM = 'rgba(22,24,28,0.55)';
const FAINT = 'rgba(22,24,28,0.38)';
const STEM = 'rgba(22,24,28,0.22)';

type Lanes = NonNullable<ChatMessage['lanes']>;

function LaneLabel({ text, color, right }: { text: string; color: string; right?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
      }}>
      <Text
        style={{ fontSize: 9, fontFamily: fontFamily.mono, letterSpacing: 0.8, color }}>
        {text}
      </Text>
      {right ? (
        <Text
          style={{
            fontSize: 9,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.4,
            color,
            opacity: 0.7,
          }}>
          {right}
        </Text>
      ) : null}
    </View>
  );
}

/** the split/merge strokes — measured, so the stems always meet the
 * three lane centers regardless of card width */
function Stems({ w, down }: { w: number; down?: boolean }) {
  if (w <= 0) return <View style={{ height: 20 }} />;
  const c = w / 2;
  const xs = [w / 6, c, (5 * w) / 6];
  const d = down
    ? xs.map((x) => `M ${x} 0 L ${x} 10 L ${c} 10 L ${c} 20`).join(' ')
    : xs.map((x) => `M ${c} 0 L ${c} 10 L ${x} 10 L ${x} 20`).join(' ');
  return (
    <Svg width={w} height={20}>
      <Path d={d} stroke={STEM} strokeWidth={1.2} fill="none" />
    </Svg>
  );
}

export function TurnLanes({
  lanes,
  booked,
  title,
  onBook,
  onDraft,
  onChip,
}: {
  lanes: Lanes;
  /** schedule.booked — once set, the whole turn folds to a receipt */
  booked?: string;
  /** what the receipt names, e.g. the schedule title */
  title: string;
  onBook: (slot: string) => void;
  onDraft: (seed: string) => void;
  /** follow-up chips load the composer, the user still says go */
  onChip: (text: string) => void;
}) {
  const [w, setW] = useState(0);
  const [open, setOpen] = useState(false);
  const rows = lanes.research?.rows ?? [];
  const [pick, setPick] = useState(rows[0]?.label);
  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width !== w) setW(width);
  };
  const flip = (v: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    setOpen(v);
  };

  // ── settled: the turn is ONE receipt line + follow-up chips ──
  if (booked) {
    return (
      <Animated.View entering={FadeIn.duration(280)} style={{ marginBottom: 26 }}>
        <View
          style={{
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.6)',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 5,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: sysColor.ready,
              }}
            />
            <Text style={{ fontSize: 15, fontFamily: fontFamily.semibold, color: INK }}>
              {`${title} · booked`}
            </Text>
          </View>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: DIM }}>
            {`${booked} · on your calendar`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
          {['Move it', 'Add someone'].map((c) => (
            <Pressable
              key={c}
              onPress={() => onChip(c === 'Move it' ? 'move the booking to ' : 'add to the booking: ')}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                height: 28,
                justifyContent: 'center',
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.4)',
                borderWidth: 1,
                borderColor: 'rgba(59,118,196,0.35)',
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text style={{ fontSize: 12.5, fontFamily: fontFamily.medium, color: sysColor.accent }}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    );
  }

  // ── research expanded: data rows, side tabs keep the other lanes ──
  if (open) {
    return (
      <View onLayout={onLayout} style={{ marginBottom: 26 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View
            style={{
              flex: 1,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.8)',
              overflow: 'hidden',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingTop: 12,
                paddingBottom: 8,
              }}>
              <Text
                style={{ fontSize: 9, fontFamily: fontFamily.mono, letterSpacing: 0.8, color: DIM }}>
                RESEARCH
              </Text>
              <Pressable onPress={() => flip(false)} hitSlop={10}>
                <Text
                  style={{ fontSize: 9, fontFamily: fontFamily.mono, letterSpacing: 0.6, color: FAINT }}>
                  CLOSE ×
                </Text>
              </Pressable>
            </View>
            <Text
              style={{
                paddingHorizontal: 14,
                paddingBottom: 10,
                fontSize: 13,
                lineHeight: 18,
                fontFamily: fontFamily.regular,
                color: 'rgba(22,24,28,0.75)',
              }}>
              {lanes.research?.summary}
            </Text>
            {rows.map((r) => (
              <Pressable
                key={r.label}
                onPress={() => setPick(r.label)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(22,24,28,0.07)',
                  backgroundColor:
                    pick === r.label ? 'rgba(59,118,196,0.12)' : 'transparent',
                  opacity: pressed ? 0.6 : 1,
                })}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: pick === r.label ? sysColor.accent : 'rgba(22,24,28,0.3)',
                    backgroundColor: pick === r.label ? sysColor.accent : 'transparent',
                  }}
                />
                <Text style={{ flex: 1, fontSize: 13.5, fontFamily: fontFamily.medium, color: INK }}>
                  {r.label}
                </Text>
                {r.meta ? (
                  <Text style={{ fontSize: 9.5, fontFamily: fontFamily.mono, color: FAINT }}>
                    {r.meta}
                  </Text>
                ) : null}
              </Pressable>
            ))}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: 'rgba(22,24,28,0.07)',
              }}>
              <Text style={{ fontSize: 12, fontFamily: fontFamily.regular, color: DIM }}>
                {pick ? `${pick} picked` : 'pick a slot'}
              </Text>
              {pick ? (
                <Pressable
                  onPress={() => onBook(pick)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: sysColor.accent,
                    opacity: pressed ? 0.7 : 1,
                  })}>
                  <Text style={{ fontSize: 13, fontFamily: fontFamily.medium, color: '#FFFFFF' }}>
                    {`Book ${pick}`}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          {/* the folded lanes wait at the edge — nothing leaves the screen */}
          <View style={{ gap: 6 }}>
            {(['ACT', 'PRO'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => flip(false)}
                style={({ pressed }) => ({
                  paddingHorizontal: 8,
                  paddingVertical: 10,
                  borderRadius: 11,
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Text
                  style={{
                    fontSize: 8.5,
                    fontFamily: fontFamily.mono,
                    letterSpacing: 0.8,
                    color: t === 'ACT' ? sysColor.accent : sysColor.ready,
                  }}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── default: the split — three lanes and the settle point ──
  return (
    <Animated.View entering={FadeIn.duration(280)} onLayout={onLayout} style={{ marginBottom: 26 }}>
      <Stems w={w} />
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        {lanes.research ? (
          <Pressable
            onPress={() => flip(true)}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 13,
              backgroundColor: 'rgba(255,255,255,0.55)',
              padding: 12,
              opacity: pressed ? 0.7 : 1,
            })}>
            <LaneLabel
              text="RESEARCH"
              color={DIM}
              right={rows.length ? `${rows.length} ›` : undefined}
            />
            <Text style={{ fontSize: 12, lineHeight: 16, fontFamily: fontFamily.regular, color: 'rgba(22,24,28,0.8)' }} numberOfLines={2}>
              {lanes.research.summary}
            </Text>
          </Pressable>
        ) : null}
        {lanes.action ? (
          <View
            style={{
              flex: 1,
              borderRadius: 13,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderWidth: 1.5,
              borderColor: 'rgba(59,118,196,0.55)',
              padding: 12,
              gap: 8,
            }}>
            <LaneLabel text="ACTION" color={sysColor.accent} />
            <Text style={{ fontSize: 12, lineHeight: 16, fontFamily: fontFamily.regular, color: 'rgba(22,24,28,0.8)' }} numberOfLines={2}>
              {lanes.action.summary}
            </Text>
            {lanes.action.book ? (
              <Pressable
                onPress={() => onBook(lanes.action!.book!)}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: sysColor.accent,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <Text style={{ fontSize: 12.5, fontFamily: fontFamily.medium, color: '#FFFFFF' }}>
                  Book
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {lanes.proposal ? (
          <Pressable
            onPress={() => lanes.proposal?.draftSeed && onDraft(lanes.proposal.draftSeed)}
            style={({ pressed }) => ({
              flex: 1,
              borderRadius: 13,
              backgroundColor: 'rgba(255,255,255,0.55)',
              padding: 12,
              opacity: pressed ? 0.7 : 1,
            })}>
            <LaneLabel text="PROPOSAL" color={sysColor.ready} right={lanes.proposal.draftSeed ? '1 ›' : undefined} />
            <Text style={{ fontSize: 12, lineHeight: 16, fontFamily: fontFamily.regular, color: 'rgba(22,24,28,0.8)' }} numberOfLines={2}>
              {lanes.proposal.summary}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Stems w={w} down />
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.7)',
          }}>
          <View
            style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: sysColor.accent }}
          />
          <Text
            style={{ fontSize: 10.5, fontFamily: fontFamily.mono, letterSpacing: 0.3, color: DIM }}>
            waiting on you · Book or open a lane
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default TurnLanes;
