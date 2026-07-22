import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, View } from 'react-native';
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
const INK_GHOST = 'rgba(22,24,28,0.38)';
const DIVIDER = 'rgba(22,24,28,0.08)';
const TAB_GAP = 18;
// the flap's diagonal cut runs 26px; the trailing inactive label
// clears it (18px is enough when the near edge is straight)
const CUT = 26;

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
                      fontSize: 11,
                      fontFamily: fontFamily.mono,
                      letterSpacing: 0.3,
                      color: k === tab ? INK_DIM : INK_GHOST,
                    }}>
                    {k === 'auto' ? 'CREW' : 'YOU'}
                  </Text>
                </Pressable>
              </View>
            )
          )}
          <View style={{ flex: 1 }} />
          {/* the card names its OWN state at the strip's right end
              (2026-07-21): the count readout is the identity line that
              tells the twin tab-cards apart. On CREW it is also the
              door to the folded routine runs. */}
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
              {`${total} ${total === 1 ? 'TASK' : 'TASKS'} COMPLETED`}
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
            return (
            <Pressable
              key={h.key}
              onPress={() => onOpenThread(h.threadId)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: undoable ? 8 : 12,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: DIVIDER,
                opacity: pressed ? 0.5 : 1,
              })}>
              {/* provenance mark (2026-07-21): crew-initiated rows wear
                  the responsible member's FACE; user-asked rows keep
                  the blue mosaic dot */}
              <View style={{ width: 16, alignItems: 'flex-start' }}>
                {h.agentId ? (
                  <CrewPixel id={h.agentId} size={16} />
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
                    honesty travels with the button */}
                {armed && undoable?.irreversible ? (
                  <Text style={{ marginTop: 3, fontSize: fontSize.caption, color: INK_DIM }}>
                    {undoable.irreversible}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
                {h.ago}
              </Text>
              {undoable ? (
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    if (undoable.irreversible && !armed) {
                      setArmedRevert(undoable.label);
                      return;
                    }
                    setArmedRevert(null);
                    onUndo(undoable);
                  }}
                  style={({ pressed }) => ({
                    // the LAST ACTION rail's quiet gray button, verbatim
                    backgroundColor: 'rgba(22,24,28,0.06)',
                    borderRadius: 0,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  {/* ONE word for the rail ("[Undo]로 통일"): the
                      irreversible two-step keeps its arm-then-fire
                      safety, only the label stops changing */}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: fontWeight.semibold,
                      color: armed ? INK : 'rgba(22,24,28,0.65)',
                    }}>
                    Undo
                  </Text>
                </Pressable>
              ) : null}
            </Pressable>
            );
          })}
        </View>
        {tab === 'auto' && routinesOpen
          ? digest.routines.map((r, idx) => (
              // expanded repeats join the SAME list as the highlights
              // ("그대로 똑같이 리스트로"): identical row anatomy. Each
              // row cascades in on its own beat (80ms stagger)
              <Animated.View
                key={r.key}
                entering={FadeInDown.duration(260).delay(80 * idx)}>
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
                <View style={{ width: 16, alignItems: 'flex-start' }}>
                  {r.agentId ? (
                    <CrewPixel id={r.agentId} size={16} />
                  ) : (
                    <MosaicDot color="rgba(22,24,28,0.4)" />
                  )}
                </View>
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
