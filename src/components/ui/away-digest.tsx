import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { AwayDigest } from '@/mock/away';
import type { Undoable } from '@/mock/undoables';
import { fontFamily, fontSize, fontWeight, spacing, sysColor } from '@/theme/theme';

import { CrewPixel } from './crew-pixel';
import { FrostedGlassFill } from './frosted-glass-fill';
import { MosaicDot } from './mosaic-dot';

const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.55)';
const INK_GHOST = 'rgba(22,24,28,0.46)';
const DIVIDER = 'rgba(22,24,28,0.08)';
const TAB_GAP = 18;

/** WHERE glyphs for the row grammar's trailing slot (2026-07-22):
 * one small product icon before the age — never a text label here */
const APP_GLYPH = {
  gmail: 'mail-outline',
  github: 'logo-github',
  drive: 'folder-outline',
  calendar: 'calendar-clear-outline',
} as const;
// the flap's diagonal cut runs 26px; the trailing inactive label
// clears it (18px is enough when the near edge is straight)
const CUT = 26;

/** the face's DONE variant (2026-07-22 "체크 마크를 넣은 페이스"): the
 * member's pixel face wearing a tiny ready-green check cell at its
 * top-right — the avatar-badge grammar, in mosaic squares. The face
 * icon now has two states: plain (pending) and checked (done). */
function DoneFace({ id }: { id: string }) {
  return (
    <View style={{ width: 16, height: 16 }}>
      <CrewPixel id={id} size={16} />
      {/* bare check, no plate (2026-07-22 "배경 없게"): the glyph
          itself carries the ready green */}
      <Text
        style={{
          position: 'absolute',
          top: -6,
          right: -7,
          color: sysColor.action,
          fontSize: 10,
          lineHeight: 11,
          fontWeight: '800',
        }}>
        ✓
      </Text>
    </View>
  );
}

/** your OWN completed asks (2026-07-24): the unset-profile person —
 * you are not a crew member, so the mark is the blank avatar, wearing
 * the same done-check badge as the faces. */
function OwnFace() {
  return (
    <View style={{ width: 18, height: 18 }}>
      {/* icon fills the box, same grid as DoneFace (2026-07-24
          "얼라인이 안 맞아") */}
      <Ionicons name="person-circle" size={18} color="rgba(22,24,28,0.4)" />
      <Text
        style={{
          position: 'absolute',
          top: -6,
          right: -7,
          color: sysColor.action,
          fontSize: 10,
          lineHeight: 11,
          fontWeight: '800',
        }}>
        ✓
      </Text>
    </View>
  );
}

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
              count, never the list size — but DONE stays, since the
              Crew/You tabs don't name the state. Open = "DONE ˄";
              nothing folded = a plain "DONE" stamp. */}
          <Pressable
            hitSlop={12}
            disabled={digest.routines.length === 0}
            onPress={toggleRoutines}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.5 : 1,
            })}>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fontFamily.mono,
                letterSpacing: 0.3,
                color: INK_DIM,
              }}>
              {digest.routines.length > 0 && !routinesOpen
                ? `+${digest.routines.length} DONE`
                : 'DONE'}
            </Text>
            {digest.routines.length > 0 ? (
              <Ionicons
                name={routinesOpen ? 'chevron-up' : 'chevron-down'}
                size={11}
                color={INK_DIM}
                style={{ marginLeft: 3 }}
              />
            ) : null}
          </Pressable>
        </View>
        <View style={{ marginTop: 6 }}>
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
              {/* provenance mark (2026-07-24): crew-initiated rows
                  wear the responsible member's FACE; your OWN asks
                  wear the unset-profile avatar ("프로필 설정 안 된
                  이모지") — the empty person, since you have no crew
                  face */}
              <View style={{ width: 20, alignItems: 'flex-start' }}>
                {h.own ? (
                  <OwnFace />
                ) : h.agentId ? (
                  <DoneFace id={h.agentId} />
                ) : (
                  <MosaicDot color={sysColor.action} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                {/* row grammar v2 (2026-07-22 "아이콘을 문장 끝으로"):
                    the WHERE glyph rides the end of the sentence, not
                    the time cluster — the age stands alone */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                  {h.app ? (
                    <Ionicons
                      name={APP_GLYPH[h.app] ?? 'apps-outline'}
                      size={12}
                      color={INK_DIM}
                    />
                  ) : null}
                </View>
                {/* the armed row states what stays done — reversibility
                    honesty travels with the swipe key */}
                {armed && undoable?.irreversible ? (
                  <Text style={{ marginTop: 3, fontSize: fontSize.caption, color: INK_DIM }}>
                    {undoable.irreversible}
                  </Text>
                ) : null}
              </View>
              {/* doneness lives on the FACE's badge for crew rows; only
                  faceless rows keep the receipt check by their time so
                  nothing is marked twice. The readout steps aside while
                  the row is swiped open. */}
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fontFamily.mono,
                  color: INK_DIM,
                  opacity: swipedKey === h.key ? 0 : 1,
                }}>
                {!h.agentId ? (
                  <Text style={{ color: sysColor.ready }}>{'✓ '}</Text>
                ) : null}
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
                {/* glyph rides the sentence end here too (2026-07-22
                    "아이콘을 문장 끝으로"); the age stands alone */}
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      flexShrink: 1,
                      fontSize: fontSize.body,
                      fontFamily: fontFamily.regular,
                      color: INK,
                    }}>
                    {r.label}
                  </Text>
                  {r.app ? (
                    <Ionicons
                      name={APP_GLYPH[r.app] ?? 'apps-outline'}
                      size={12}
                      color={INK_DIM}
                    />
                  ) : null}
                </View>
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
