import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { AwayDigest } from '@/mock/away';
import type { Undoable } from '@/mock/undoables';
import { fontFamily, fontSize, fontWeight, spacing, sysColor } from '@/theme/theme';

import { FrostedGlassFill } from './frosted-glass-fill';

const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.55)';
const INK_GHOST = 'rgba(22,24,28,0.46)';
const DIVIDER = 'rgba(22,24,28,0.08)';
const TAB_GAP = 18;

// APP_GLYPH retired 2026-07-28 ("뒤에 이거 아이콘지우기"): the digest rows
// dropped their trailing WHERE icons — which app did the work lives in the
// thread the row opens.
// the flap's diagonal cut runs 26px; the trailing inactive label
// clears it (18px is enough when the near edge is straight)
const CUT = 26;

// DoneFace / OwnFace and the FACE const retired 2026-07-28 ("얼굴들을
// 빼줘"): the digest rows dropped their pixel faces — the 25px mark column
// survives (shared with the board rows) carrying only the receipt check.

const easeNext = () =>
  LayoutAnimation.configureNext({
    duration: 280,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'easeInEaseOut' },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });

/**
 * The away delta as ONE folder (2026-07-24 "crew you 없이 그냥
 * 하나로"): the Crew/You tab split retired — a single COMPLETED list,
 * merged by recency. Provenance moved onto the row mark instead:
 * crew-initiated rows wear the member's face, your own asks wear the
 * unset-profile avatar. Still a digest, not a ledger: rule repeats
 * fold under +N DONE, undo rides the rows, details live in Activity.
 */
export function AwayDigestCard({
  digest,
  undoables,
  enterDelay = 0,
  onOpenThread,
  onUndo,
}: {
  digest: AwayDigest;
  /** rows with an undoKey wear the LAST ACTION button inline */
  undoables: Undoable[];
  /** board stagger slot (the hero leads since 2026-07-21) */
  enterDelay?: number;
  onOpenThread: (threadId: string) => void;
  onUndo: (u: Undoable) => void;
}) {
  const [labelW, setLabelW] = useState(0);
  const [routinesOpen, setRoutinesOpen] = useState(false);
  const [armedRevert, setArmedRevert] = useState<string | null>(null);
  // which row is swiped open: its time readout hides while the Undo
  // key is out (2026-07-22 "숫자정보는 사라지게")
  const [swipedKey, setSwipedKey] = useState<string | null>(null);

  const flapW = labelW ? TAB_GAP + labelW + TAB_GAP : 122;

  const toggleRoutines = () => {
    // the height glides via LayoutAnimation, but each row makes its own
    // ENTRANCE (2026-07-21 "리스트마다 다라락"): no `create` here so the
    // staggered FadeInDown on the rows is the only arrival motion
    LayoutAnimation.configureNext({
      duration: 300,
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setRoutinesOpen((v) => !v);
  };

  // merged single list (2026-07-24): crew work and your own asks in
  // one COMPLETED river, newest first (ago strings parsed to minutes)
  const agoMin = (s: string) => {
    const m = s.match(/(\d+)\s*([mhd])/);
    if (!m) return 0;
    return Number(m[1]) * (m[2] === 'm' ? 1 : m[2] === 'h' ? 60 : 1440);
  };
  const rows = [
    ...digest.auto.map((h) => ({ ...h, own: false })),
    ...digest.asked.map((h) => ({ ...h, own: true })),
  ].sort((a, b) => agoMin(a.ago) - agoMin(b.ago));

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(enterDelay)}
      style={{ marginTop: 28 }}>
      <View
        style={{
          paddingHorizontal: 18,
          paddingBottom: 14,
          shadowColor: '#16181C',
          shadowOpacity: 0.1,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 5,
        }}>
        {/* no overflow:hidden — the flap notch is SVG outside the box.
            The flap NEVER moves: the active tab's label sits inside it
            at front-left, the inactive one waits behind on the ghost
            strip, past the diagonal cut. */}
        <FrostedGlassFill radius={16} tabWidth={flapW} />
        <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
          <Text
            onTextLayout={(e) => {
              const w = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
              if (w && w !== labelW) setLabelW(w);
            }}
            style={{
              fontSize: 12,
              fontFamily: fontFamily.mono,
              letterSpacing: 0.3,
              color: INK_DIM,
            }}>
            Completed
          </Text>
          <View style={{ flex: 1 }} />
          {/* corner grammar (2026-07-22, same as the hero): +HIDDEN
              count, never the list size. 2026-07-25 ("done 빼고 숫자만"):
              the word DONE is gone — the "Completed" title on this same
              strip already says the state, so it was said twice. Now
              just "+3 ˅"; when nothing is folded there is no number to
              show, so the chevron stands alone. */}
          <Pressable
            hitSlop={12}
            disabled={digest.routines.length === 0}
            onPress={toggleRoutines}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.5 : 1,
            })}>
            {digest.routines.length > 0 && !routinesOpen ? (
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: fontFamily.mono,
                  letterSpacing: 0.3,
                  color: INK_DIM,
                }}>
                {`+${digest.routines.length}`}
              </Text>
            ) : null}
            {digest.routines.length > 0 ? (
              <Ionicons
                name={routinesOpen ? 'chevron-up' : 'chevron-down'}
                size={11}
                color={INK_DIM}
                // only gap the chevron when a "+N" sits before it
                style={routinesOpen ? undefined : { marginLeft: 3 }}
              />
            ) : null}
          </Pressable>
        </View>
        <View style={{ marginTop: 6 }}>
          {/* empty shell speaks (2026-07-28 "빈칸을 말이 맞게"): the card
              stays on the board while the new mock world is unseeded */}
          {rows.length === 0 ? (
            <Text
              style={{
                paddingTop: 6,
                paddingBottom: 10,
                fontSize: fontSize.body,
                fontFamily: fontFamily.regular,
                color: 'rgba(22,24,28,0.4)',
              }}>
              Nothing yet
            </Text>
          ) : null}
          {rows.map((h, idx) => {
            const undoable = h.undoKey
              ? undoables.find((u) => u.label === h.undoKey)
              : undefined;
            const armed = undoable ? armedRevert === undoable.label : false;
            // ONE resting anatomy for every row (2026-07-22 "일관된
            // 유엑스"): mark, label, check/time — no inline buttons.
            // Undo hides behind a left swipe (below).
            const row = (
            <Pressable
              onPress={() => onOpenThread(h.threadId)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: 12,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: DIVIDER,
                opacity: pressed ? 0.5 : 1,
              })}>
              {/* NO front mark at all (2026-07-28 "앞에 아무것도 없어도돼"):
                  the label leads the row; doneness moved to the trailing
                  mosaic tile beside the time */}
              <View style={{ flex: 1 }}>
                {/* the WHERE glyph retired (2026-07-28 "뒤에 이거
                    아이콘지우기") — the row is label and age, nothing
                    else; which app did the work lives in the thread */}
                <Text
                  numberOfLines={1}
                  style={{
                    flexShrink: 1,
                    fontSize: fontSize.body,
                    fontFamily: fontFamily.regular,
                    color: INK,
                  }}>
                  {h.label}
                </Text>
                {/* the armed row states what stays done — reversibility
                    honesty travels with the swipe key */}
                {armed && undoable?.irreversible ? (
                  <Text style={{ marginTop: 3, fontSize: fontSize.caption, color: INK_DIM }}>
                    {undoable.irreversible}
                  </Text>
                ) : null}
              </View>
              {/* the green tile lasted one round (2026-07-28 "이 초록
                  아이콘도 지우기"): the section header says Completed,
                  so the rows carry no mark at all — label and age only.
                  The readout steps aside while the row is swiped. */}
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fontFamily.mono,
                  color: INK_DIM,
                  opacity: swipedKey === h.key ? 0 : 1,
                }}>
                {h.ago}
              </Text>
            </Pressable>
            );
            if (!undoable) return <View key={h.key}>{row}</View>;
            // swipe left → the dark UNDO key (iOS muscle memory); the
            // irreversible two-step arms on the first tap
            return (
              <ReanimatedSwipeable
                key={h.key}
                friction={2}
                rightThreshold={36}
                overshootRight={false}
                onSwipeableWillOpen={() => setSwipedKey(h.key)}
                onSwipeableWillClose={() => {
                  setArmedRevert(null);
                  setSwipedKey((k) => (k === h.key ? null : k));
                }}
                renderRightActions={(_progress, _translation, methods) => (
                  <Pressable
                    onPress={() => {
                      if (undoable.irreversible && !armed) {
                        setArmedRevert(undoable.label);
                        return;
                      }
                      setArmedRevert(null);
                      methods.close();
                      onUndo(undoable);
                    }}
                    style={({ pressed }) => ({
                      width: 76,
                      marginLeft: 10,
                      marginVertical: 6,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      // DARK on purpose ("버튼이 더 진해야"): armed goes
                      // full ink for the second, deciding tap
                      backgroundColor: armed ? '#16181C' : 'rgba(22,24,28,0.82)',
                      opacity: pressed ? 0.8 : 1,
                    })}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: fontWeight.semibold,
                        color: '#FFFFFF',
                      }}>
                      Undo
                    </Text>
                  </Pressable>
                )}>
                {row}
              </ReanimatedSwipeable>
            );
          })}
        </View>
        {routinesOpen
          ? digest.routines.map((r, idx) => (
              // expanded repeats are CHILDREN of the rule row above
              // (2026-07-22 "들여쓰기해서 안으로"): indented past the
              // parent's mark column, no repeated face — the parent
              // already said who. Each cascades in on its own beat.
              <Animated.View
                key={r.key}
                entering={FadeInDown.duration(260).delay(80 * idx)}
                style={{ marginLeft: 28 }}>
              <Pressable
                onPress={() => onOpenThread(r.threadId)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: DIVIDER,
                  opacity: pressed ? 0.5 : 1,
                })}>
                {/* app glyph retired here with the main rows (2026-07-28
                    "뒤에 이거 아이콘지우기"): label and age only */}
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: fontSize.body,
                    fontFamily: fontFamily.regular,
                    color: INK,
                  }}>
                  {r.label}
                </Text>
                {/* no check here (2026-07-22 "뜬금없는데"): sub-entries
                    just carry time */}
                <Text style={{ fontSize: 11, fontFamily: fontFamily.mono, color: INK_DIM }}>
                  {r.ago}
                </Text>
              </Pressable>
              </Animated.View>
            ))
          : null}
      </View>
    </Animated.View>
  );
}

export default AwayDigestCard;
