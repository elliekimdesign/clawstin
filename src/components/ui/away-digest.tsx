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
import { TabFlapBg } from './tab-flap';

const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.55)';
const INK_GHOST = 'rgba(22,24,28,0.46)';
const DIVIDER = 'rgba(22,24,28,0.08)';
const TAB_GAP = 18;
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

const easeNext = () =>
  LayoutAnimation.configureNext({
    duration: 280,
    create: { type: 'easeInEaseOut', property: 'opacity' },
    update: { type: 'easeInEaseOut' },
    delete: { type: 'easeInEaseOut', property: 'opacity' },
  });

/**
 * The away delta as a TWO-TAB folder (2026-07-21): same silhouette,
 * two provenances, named by WHO initiated (the "YOU/CREW" rename):
 * CREW = routine agents acting alone (rules and schedules); YOU =
 * one-off chat-input work, completed. The active tab is the frosted
 * flap; the inactive one sits shaded on the ghost strip behind,
 * exactly where a closed folder's second tab would peek.
 *
 * Still a digest, not a ledger: per-tab computed headline, promoted
 * rows only, rule repeats folded under +N MORE (HANDLED side). The
 * undo rail rides the rows inline. No dismiss and no fold (both were
 * tried): the card stays for the session; details live in Activity.
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
  const [tab, setTab] = useState<'auto' | 'asked'>('auto');
  const [handledW, setHandledW] = useState(0);
  const [askedW, setAskedW] = useState(0);
  const [routinesOpen, setRoutinesOpen] = useState(false);
  const [armedRevert, setArmedRevert] = useState<string | null>(null);
  // which row is swiped open: its time readout hides while the Undo
  // key is out (2026-07-22 "숫자정보는 사라지게")
  const [swipedKey, setSwipedKey] = useState<string | null>(null);

  // tab footprints in the flap-measure grammar: 18 + label + 18. The
  // ACTIVE tab always wears the front-left flap (2026-07-21 "asked가
  // 앞으로 오고"): selecting a tab brings its folder forward, so the
  // flap stays put and the labels trade places instead.
  const W1 = handledW ? TAB_GAP + handledW + TAB_GAP : 110;
  const W2 = askedW ? TAB_GAP + askedW + TAB_GAP : 90;

  const switchTab = (t: 'auto' | 'asked') => {
    if (t === tab) return;
    easeNext();
    setTab(t);
    setArmedRevert(null);
    setRoutinesOpen(false);
  };
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

  const rows = tab === 'auto' ? digest.auto : digest.asked;
  const total =
    tab === 'auto' ? digest.auto.length + digest.routines.length : digest.asked.length;

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
        <FrostedGlassFill radius={16} tabWidth={tab === 'auto' ? W1 : W2} />
        <View style={{ height: 26, flexDirection: 'row', alignItems: 'center' }}>
          {(tab === 'auto' ? (['auto', 'asked'] as const) : (['asked', 'auto'] as const)).map(
            (k, i) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* second label clears the front flap's diagonal */}
                {i === 1 ? <View style={{ width: TAB_GAP + CUT }} /> : null}
                <Pressable
                  hitSlop={10}
                  onPress={() => switchTab(k)}
                  style={({ pressed }) =>
                    k === tab
                      ? { opacity: pressed ? 0.6 : 1 }
                      : {
                          // the waiting tab is a BUTTON in the flap's
                          // own shape (2026-07-21 "쉐입을 이거랑
                          // 같이"): mini flap silhouette, shaded
                          height: 26,
                          justifyContent: 'center',
                          paddingLeft: 12,
                          paddingRight: 12 + CUT,
                          opacity: pressed ? 0.6 : 1,
                        }
                  }>
                  {k !== tab ? (
                    <TabFlapBg
                      w={(k === 'auto' ? handledW || 60 : askedW || 44) + 24 + CUT * 2}
                    />
                  ) : null}
                  <Text
                    onTextLayout={(e) => {
                      const w = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
                      if (k === 'auto' && w !== handledW) setHandledW(w);
                      if (k === 'asked' && w !== askedW) setAskedW(w);
                    }}
                    style={{
                      fontSize: 12,
                      fontFamily: fontFamily.mono,
                      letterSpacing: 0.3,
                      color: k === tab ? INK_DIM : INK_GHOST,
                    }}>
                    {k === 'auto' ? 'Crew' : 'You'}
                  </Text>
                </Pressable>
              </View>
            )
          )}
          <View style={{ flex: 1 }} />
          {/* corner grammar (2026-07-22, same as the hero): +HIDDEN
              count, never the list size — but DONE stays, since the
              Crew/You tabs don't name the state. Open = "DONE ˄";
              nothing folded = a plain "DONE" stamp. */}
          <Pressable
            hitSlop={12}
            disabled={!(tab === 'auto' && digest.routines.length > 0)}
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
              {tab === 'auto' && digest.routines.length > 0 && !routinesOpen
                ? `+${digest.routines.length} DONE`
                : 'DONE'}
            </Text>
            {tab === 'auto' && digest.routines.length > 0 ? (
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
              {/* provenance mark (2026-07-21): crew-initiated rows wear
                  the responsible member's FACE; user-asked rows keep
                  the blue mosaic dot */}
              <View style={{ width: 20, alignItems: 'flex-start' }}>
                {h.agentId ? (
                  <DoneFace id={h.agentId} />
                ) : (
                  <MosaicDot color={sysColor.action} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{
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
              {/* doneness lives on the FACE's badge for crew rows; only
                  faceless rows keep the receipt check by their time so
                  nothing is marked twice. The readout steps aside while
                  the row is swiped open. */}
              <Text
                style={{
                  fontSize: 10,
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
        {tab === 'auto' && routinesOpen
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
                {/* no check here (2026-07-22 "뜬금없는데"): these are
                    sub-entries — the parent row's badge already says
                    done for the whole group; children just carry time */}
                <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
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
