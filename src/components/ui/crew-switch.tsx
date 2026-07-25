import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';

import { ClawstinMark } from '@/components/ui/clawstin-mark';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { CrewPixel } from '@/components/ui/crew-pixel';
import { CREW_LIST, CrewKey } from '@/mock/crew-routing';
import { darkChat, fontFamily, fontSize, spacing } from '@/theme/theme';

const PILL_H = 40;
const SLOT_W = 92; // per-name slot width in the collapsed strip

// The crew names' own voice. The pixel bitmap retired 2026-07-24
// ("typography가 off해서 튄다"), and the uppercase+wide-tracking Helvetica
// that briefly replaced it went too ("폰트 바꾼것도 마음에안들어"): it was
// still louder than anything under it. Now the names speak the SAME label
// type as the chat content below (fontFamily.medium at 12, sentence case,
// [id].tsx:1005) so header and thread read as one screen. Pixel geometry
// (cell 1.25) is gone, so widths are estimated against THIS type.
const NAME_SIZE = 12;
const NAME_TRACKING = 0.2;
/** rough advance per mixed-case Helvetica char at NAME_SIZE, incl. tracking */
const NAME_CHAR_W = NAME_SIZE * 0.53 + NAME_TRACKING;
const nameWidth = (s: string) => Math.ceil(s.length * NAME_CHAR_W);
// Same ink as the composer's tool-chip labels (2026-07-24 "칩에 있는
// 글씨색"): the light pill and those chips are the one register, so they
// share color, not just size/weight. On the header blue this lands at
// 3.35:1 — a touch BETTER than the white-0.95 it replaces (3.2:1).
const NAME_INK = 'rgba(22,24,28,0.7)';
/** the chip ink at full strength, for the name that's currently bound */
const NAME_INK_ACTIVE = '#16181C';
/** Liquid Glass only exists on iOS 26+; FrostedGlassFill is the fallback. */
const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

// Our own pixel crew (the Muppet photos are retired): route key ->
// crew-pixel character id.
const PIXEL_BY_ROUTE: Record<CrewKey, string> = {
  researcher: 'scout', // Specs
  writer: 'quill', // Wink
  triage: 'pilot', // Crop
  orchestrator: 'muppet', // Beanie
};

/** Small round crew face chip: pixel face on the white logo-chip chrome. */
function CrewAvatar({ crewKey, size = 18 }: { crewKey: CrewKey; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: '#F5F6F4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(22,24,28,0.1)',
      }}>
      <CrewPixel id={PIXEL_BY_ROUTE[crewKey]} size={size - 5} />
    </View>
  );
}
// Center capsule is a FIXED medium size — sized for the longest name
// ("Orchestrator") so every crew sits centered in the same constant box,
// never stretching per-name. The outer glass pill hugs it flush: the same
// RING gap on every side. Absolute children are positioned inside the pill's
// border, so inner offsets subtract BORDER to keep the visual gap even.
const BORDER = 1;
const RING = 3;
// Everything inside the pill lives in its INNER box (inside the border).
const INNER_H = PILL_H - 2 * BORDER;
// face at 10 + longest name at cell 1.25 + pin inset
const CENTER_W = 156;
const PILL_W = CENTER_W + 2 * RING;
// One smooth glide with barely-there overshoot — no jitter.
const SLIDE_SPRING = { damping: 24, stiffness: 220, mass: 0.9 };
const EXTEND_SPRING = { damping: 24, stiffness: 200, mass: 0.9 };
// Cross-fade between the collapsed reel and the expanded row.
const FADE_TIMING = { duration: 240, easing: Easing.out(Easing.cubic) };

/**
 * Picker-wheel crew indicator: ONE fixed glass pill at top-center; the crew
 * NAME cycles through it (Research → Scribe → Operator…) while routing is
 * "thinking," landing on whoever actually picks up the request. Neighbors
 * peek faded on either side, like a horizontal iOS picker wheel. Long-press
 * expands the SAME pill into a single scrollable row showing every crew name
 * at once, with the white highlight following whichever one is selected —
 * no separate floating dropdown, no page-breaking grid.
 */
export function CrewSwitch({
  selected,
  manual,
  busy,
  onSelect,
  onExpandChange,
  light = false,
}: {
  selected: CrewKey | null;
  manual: boolean;
  // Not read here anymore — the store's Transition Hold sequence (respond())
  // now owns all pacing between crews; this component just renders whatever
  // `selected` currently is. Kept in the prop signature for call-site parity.
  busy: boolean;
  onSelect: (key: CrewKey) => void;
  /** fires when the pill expands/collapses — the header hides its side
   * buttons while expanded so the row can take the full width */
  onExpandChange?: (expanded: boolean) => void;
  /** compose reskin (2026-07-17 "픽셀 가져갈 필요 없어"): frosted white
   * face + plain Helvetica label while COLLAPSED. Expanding still flips
   * to the dark readout — the picker is a machine moment, and the
   * pixel reel's width math stays untouched. */
  light?: boolean;
}) {
  const { width: winW } = useWindowDimensions();
  // Expanded pill's max width: nearly the full screen — the header's side
  // buttons hide while expanded, so only the outer margins are reserved.
  // The row scrolls internally if the crew names need more space than this.
  const maxExpandedW = winW - 2 * spacing.md;

  const [expanded, setExpanded] = useState(false);
  // measured Helvetica widths per light-badge label (name → px)
  const [lightNameWs, setLightNameWs] = useState<Record<string, number>>({});
  const strip = useSharedValue(0); // -index * slotW(state), offset so `selected` centers
  const stripOpacity = useSharedValue(1);
  const pillW = useSharedValue(PILL_W);
  const highlightLeft = useSharedValue(0);
  const highlightW = useSharedValue(SLOT_W); // expanded highlight width, glides per-name
  const expandT = useSharedValue(0); // 0 = collapsed reel, 1 = expanded row
  const positioned = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoClose = () => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
  };
  useEffect(() => clearAutoClose, []);

  useEffect(() => {
    onExpandChange?.(expanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const indexOf = (key: CrewKey | null) =>
    key ? CREW_LIST.findIndex((c) => c.key === key) : -1;

  // Natural (unshrunk) per-name width in the expanded row, roughly matching
  // each name's rendered width at fontSize.small. Names only — no avatars
  // here (cognitive load): all four fit on screen, so the row never needs
  // to scroll. Avatars appear on the collapsed badge after selection.
  const expandedSlotWidths = useMemo(
    () =>
      CREW_LIST.map((c) =>
        Math.max(SLOT_W * 0.72, nameWidth(c.name) + 26)
      ),
    []
  );
  const expandedOffsets = useMemo(() => {
    let x = 0;
    return expandedSlotWidths.map((w) => {
      const start = x;
      x += w;
      return start;
    });
  }, [expandedSlotWidths]);
  const expandedTotalW = expandedOffsets.length
    ? expandedOffsets[expandedOffsets.length - 1] + expandedSlotWidths[expandedSlotWidths.length - 1]
    : 0;

  // Collapsed width HUGS the current name (2026-07-16 "간격오류"):
  // face inset 10 + face 20 + gap 8 + exact text width + trailing
  // inset (wider when the pin ✕ is up). While the routing reel is
  // cycling, the width holds the fixed reel window instead so names
  // don't jitter the box.
  const badgeName =
    selected === null
      ? 'New task'
      : (CREW_LIST.find((c) => c.key === selected)?.name ?? '');
  const pinned = manual && selected !== null;
  // LIGHT badge geometry: ONE padding rule for every label, and the
  // pill HUGS the measured text (2026-07-17 "같은 패딩... 여백이
  // 중간에 길면 안돼") — face inset 10 + face 20 + gap 8 + measured
  // Helvetica width + (pinned: 10 gap + ✕ zone 21 / else 12 inset).
  // Widths land via onTextLayout; a per-char estimate covers the
  // first frame.
  const lightLabel =
    selected === null ? 'New task' : (CREW_LIST.find((c) => c.key === selected)?.name ?? '');
  const lightNameW =
    lightNameWs[lightLabel] ?? nameWidth(lightLabel) + 4;
  // faceless marquee (2026-07-22 "전광판처럼": the reply's own face
  // carries identity now — the pill is text-only status)
  const restW = light
    ? 14 + lightNameW + (pinned ? 10 + 21 : 12) + 2 * BORDER
    : 14 + nameWidth(badgeName) + (pinned ? 35 : 12) + 2 * BORDER;

  // Pure "render whatever `selected` is" — all pacing (how long each crew
  // is shown before the next one) is decided upstream in the store's
  // Transition Hold sequence, not here. Adjacent crews glide with a physical
  // slide. Non-adjacent jumps would otherwise visually SWEEP PAST whichever
  // crew sits between them in CREW_LIST — a crew that was never actually
  // selected — so those cross-fade instead: fade out, snap position, fade in.
  useEffect(() => {
    const i = indexOf(selected);
    if (i < 0) return; // stay put

    if (expanded) {
      // Expanded: the highlight glides to the selected slot's offset and
      // its width glides to that name's slot width — one continuous motion.
      // No programmatic scroll here: yanking the row under her finger is
      // what made tapping back and forth feel broken.
      highlightLeft.value = withSpring(expandedOffsets[i] ?? 0, EXTEND_SPRING);
      highlightW.value = withSpring(expandedSlotWidths[i] ?? SLOT_W, EXTEND_SPRING);
      return;
    }

    const target = -i * SLOT_W;
    if (!positioned.current) {
      strip.value = target;
      positioned.current = true;
      return;
    }

    const fromIndex = -strip.value / SLOT_W;
    const distance = Math.abs(i - fromIndex);

    if (distance <= 1) {
      strip.value = withSpring(target, SLIDE_SPRING);
    } else {
      stripOpacity.value = withTiming(0, { duration: 160 }, (finished) => {
        if (finished) {
          strip.value = target;
          stripOpacity.value = withTiming(1, { duration: 220 });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, expanded]);

  // Long-press expands the SAME glass pill into a single-row scrollable
  // strip (width clamped to the header's available space — it scrolls
  // internally rather than growing past the screen). Tapping a name selects
  // it; the highlight glides to it immediately, and the panel auto-closes
  // ~2s later.
  useEffect(() => {
    // 2 * RING: the content padding — without it the pill runs narrower
    // than its slots and the end capsule presses into the outline.
    const targetPillW = expanded
      ? Math.min(expandedTotalW + 2 * RING, maxExpandedW)
      : selected !== null && busy
        ? PILL_W
        : restW;
    pillW.value = withSpring(targetPillW, EXTEND_SPRING);
    expandT.value = withTiming(expanded ? 1 : 0, FADE_TIMING);

    if (expanded) {
      const i = indexOf(selected);
      highlightLeft.value = i >= 0 ? expandedOffsets[i] ?? 0 : 0;
      highlightW.value = i >= 0 ? expandedSlotWidths[i] ?? SLOT_W : SLOT_W;
      requestAnimationFrame(() => {
        if (i >= 0) scrollRef.current?.scrollTo({ x: Math.max(0, (expandedOffsets[i] ?? 0) - 40), animated: false });
      });
    } else {
      const i = indexOf(selected);
      if (i >= 0) strip.value = withSpring(-i * SLOT_W, EXTEND_SPRING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, maxExpandedW, restW, busy, selected]);

  const pillStyle = useAnimatedStyle(() => ({ width: pillW.value }));
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: strip.value + pillW.value / 2 - SLOT_W / 2 }],
    opacity: stripOpacity.value,
  }));
  // Both layers stay mounted and cross-fade — no hard content swap.
  const collapsedLayerStyle = useAnimatedStyle(() => ({ opacity: 1 - expandT.value }));
  const expandedLayerStyle = useAnimatedStyle(() => ({ opacity: expandT.value }));

  const openPanel = () => {
    clearAutoClose();
    setExpanded((v) => !v);
  };
  const closePanel = () => {
    clearAutoClose();
    setExpanded(false);
  };
  // Tap freely — every tap reselects and RESETS the timer; ~2s after the
  // last tap the pill shrinks back and the avatar badge takes over.
  const selectAndScheduleClose = (key: CrewKey) => {
    onSelect(key);
    clearAutoClose();
    autoCloseTimer.current = setTimeout(() => {
      setExpanded(false);
      autoCloseTimer.current = null;
    }, 2000);
  };

  return (
    <View style={{ height: PILL_H, alignItems: 'center' }}>
      {expanded ? (
        <Pressable
          onPress={closePanel}
          style={{ position: 'absolute', top: -1000, left: -1000, right: -1000, height: 3000, zIndex: 1 }}
        />
      ) : null}
      {/* the clipping wrapper has to carry the SAME radius as the face
          below it, or its square corners crop the round pill back into a
          box (2026-07-24) */}
      <Animated.View
        style={[{ borderRadius: light ? 999 : 0, overflow: 'hidden', zIndex: 2 }, pillStyle]}>
        <View
          style={{
            height: PILL_H,
            // SYSTEM READOUT window (2026-07-16 "사인이 들어오는 곳"):
            // not a keycap — this is where the machine's routing signal
            // ARRIVES, so it wears a dark display face with a faintly
            // lit rim, like a powered readout on the desk. v2 same day
            // ("여기도 컬러바꾸기" — near-white desk pass): the generic
            // navy swapped for a deepened cut of the app's own
            // accent-blue (#3B76C4 family), tying the readout to the
            // same identity color as the top rule/history key.
            // v4 (2026-07-24 "동그란 Liquid Glass 기준"): FULLY ROUND on
            // the light face. The 14-radius folder curve made the pill the
            // odd one out in a header whose < and + are both r=999 circles
            // — three items, two round and one soft-square. The header is
            // now one Apple-glass family; the folder curve stays on the
            // board's cards, where it belongs.
            borderRadius: light ? 999 : 0,
            backgroundColor: light ? 'transparent' : 'rgba(30,58,110,0.9)',
            borderWidth: light ? 0 : 1,
            borderColor: 'rgba(143,191,242,0.35)',
            overflow: 'hidden',
          }}>
          {light ? (
            // v4 (2026-07-24): the SAME material as the header's < and +
            // — Apple's clear Liquid Glass, gated because it only exists
            // on iOS 26+. FrostedGlassFill stays underneath as the
            // fallback and as the whisper of white veil that keeps the
            // pill blended with the desk blue rather than a gray box
            // (v3, "배경을 밑에 채팅 필드랑 같게"). Names stay white
            // (chat-text grammar).
            <>
              {GLASS_AVAILABLE ? (
                <GlassView
                  glassEffectStyle="clear"
                  colorScheme="light"
                  style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
                  pointerEvents="none"
                />
              ) : null}
              <FrostedGlassFill flat radius={999} tint="rgba(255,255,255,0.14)" />
            </>
          ) : null}
          {/* Collapsed layer: fixed centered capsule + picker-wheel strip.
              Stays mounted and cross-fades out while the expanded row fades
              in, so open/close reads as one continuous morph. */}
          <Animated.View
            pointerEvents={expanded ? 'none' : 'auto'}
            style={[StyleSheet.absoluteFill, collapsedLayerStyle]}>
            {/* Sliding row: only shown while routing is animating (the
                name reel cycling). At rest a badge sits in the capsule:
                the crew's round avatar + name once assigned, or the
                orchestrator face + "New Chat" while unassigned. */}
            {selected !== null && busy ? (
              <Animated.View
                style={[
                  { flexDirection: 'row', height: INNER_H, alignItems: 'center' },
                  stripStyle,
                ]}>
                {CREW_LIST.map((c, idx) => (
                  <ReelLabel
                    key={c.key}
                    name={c.name}
                    idx={idx}
                    strip={strip}
                    active={c.key === selected}
                    onPress={() => selectAndScheduleClose(c.key)}
                    light={light}
                  />
                ))}
              </Animated.View>
            ) : (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  // LEFT-ANCHORED with fixed insets (2026-07-16 "모든
                  // 경우에 얼라인"): face always at 10, name always at
                  // 38 — identical alignment for every name length;
                  // the pin ✕ owns the right inset
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingLeft: 14,
                  gap: 8,
                }}>
                {light ? (
                  // compose voice: the SAME label as the composer's tool
                  // chips below (2026-07-24 "밑에 회색 글씨랑 맞춰야") —
                  // 12/medium/ink-0.7, matching them in color too, not
                  // just size. (13/Bold + white read as a heavier,
                  // bigger, brighter voice than any content it sat
                  // above.) Still measured, so the pill hugs with the
                  // shared paddings.
                  <Text
                    onTextLayout={(e) => {
                      const w = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
                      if (w && lightNameWs[lightLabel] !== w) {
                        setLightNameWs((prev) => ({ ...prev, [lightLabel]: w }));
                      }
                    }}
                    style={{
                      fontSize: NAME_SIZE,
                      fontFamily: fontFamily.medium,
                      letterSpacing: NAME_TRACKING,
                      color: NAME_INK,
                    }}>
                    {lightLabel}
                  </Text>
                ) : (
                  <CrewName
                    text={
                      selected === null
                        ? 'New task'
                        : (CREW_LIST.find((c) => c.key === selected)?.name ?? '')
                    }
                    color="#EAF4FF"
                  />
                )}
                {/* pinned manually: the ✕ says "tap to release to auto" */}
                {manual && selected !== null ? (
                  <View
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: 0,
                      bottom: 0,
                      justifyContent: 'center',
                    }}>
                    <Ionicons
                      name="close"
                      size={13}
                      color={light ? 'rgba(22,24,28,0.7)' : 'rgba(255,255,255,0.9)'}
                    />
                  </View>
                ) : null}
              </View>
            )}
          </Animated.View>

          {/* Expanded layer: scrollable single row + gliding highlight. */}
          <Animated.View
            pointerEvents={expanded ? 'auto' : 'none'}
            style={[StyleSheet.absoluteFill, expandedLayerStyle]}>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: RING, alignItems: 'center' }}
              style={{ height: INNER_H }}>
              <View style={{ width: expandedTotalW, height: INNER_H }}>
                <View style={{ flexDirection: 'row', height: INNER_H, alignItems: 'center' }}>
                  {CREW_LIST.map((c, idx) => (
                    <Pressable
                      key={c.key}
                      onPress={() => selectAndScheduleClose(c.key)}
                      style={({ pressed }) => ({
                        width: expandedSlotWidths[idx],
                        height: INNER_H,
                        alignItems: 'center',
                        justifyContent: 'center',
                        // the 2026-07-16 "optical lift" (paddingBottom
                        // 4) retired with the navy face — on the glass
                        // it read as sitting HIGH ("살짝 위로",
                        // 2026-07-17); true center now
                        opacity: pressed ? 0.6 : 1,
                      })}>
                      <CrewName
                        text={c.name}
                        // ink on the light glass face, lit on the navy
                        // readout — same type metrics either way so
                        // the slot/highlight math never shifts. Idle
                        // names lifted 0.4 → 0.65 (2026-07-17
                        // "ligibility가 약해")
                        color={
                          light
                            ? c.key === selected
                              ? NAME_INK_ACTIVE
                              : NAME_INK
                            : c.key === selected
                              ? '#EAF4FF'
                              : 'rgba(234,244,255,0.4)'
                        }
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Animated.View>

          {/* long-press catcher lives ONLY while collapsed — a disabled
              Pressable still swallows touches, which was shading the
              first 130px of the expanded row (Research/Scribe dead zone) */}
          {!expanded ? (
            <Pressable
              onLongPress={openPanel}
              delayLongPress={280}
              // tap on a manually pinned pill = release back to auto
              onPress={
                manual && selected !== null ? () => onSelect(selected) : undefined
              }
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: PILL_H }}
            />
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

/** One crew name in the pill's machine voice: uppercase Helvetica, tracked.
 * Shared by the collapsed reel, the expanded row, and the dark badge so all
 * three read as the same label. */
function CrewName({ text, color }: { text: string; color: string }) {
  return (
    <Text
      numberOfLines={1}
      style={{
        fontSize: NAME_SIZE,
        fontFamily: fontFamily.medium,
        letterSpacing: NAME_TRACKING,
        color,
      }}>
      {text}
    </Text>
  );
}

/** The main logo on its round white chip (the Home header's own
 * lockup, miniaturized), sized for the pill's New Chat badge. */
function LogoChip({ size = 18 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: '#F5F6F4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(22,24,28,0.1)',
      }}>
      <ClawstinMark size={size - 5} />
    </View>
  );
}

/** One name in the collapsed reel; fades/shrinks by distance from center.
 * (The whole collapsed layer cross-fades on expand — handled by the parent.) */
function ReelLabel({
  name,
  idx,
  strip,
  active,
  onPress,
  light,
}: {
  name: string;
  idx: number;
  strip: SharedValue<number>;
  active: boolean;
  onPress: () => void;
  /** ink names on the light glass face (2026-07-17 v3) */
  light?: boolean;
}) {
  const innerStyle = useAnimatedStyle(() => {
    // Distance (in slots) between this label and whichever slot is centered.
    const centeredIndex = -strip.value / SLOT_W;
    const dist = Math.abs(idx - centeredIndex);
    // Neighbors fully fade by dist 1: the pill now hugs the capsule with no
    // side room, so a resting peek would clip into an odd sliver. During a
    // slide the incoming/outgoing names still cross-fade through the center.
    const opacity = interpolate(dist, [0, 1], [1, 0], 'clamp');
    const scale = interpolate(dist, [0, 1, 2], [1, 0.86, 0.75], 'clamp');
    return { opacity, transform: [{ scale }] };
  });
  return (
    <Animated.View
      style={[{ width: SLOT_W, height: INNER_H, alignItems: 'center', justifyContent: 'center' }, innerStyle]}>
      {/* same de-lift as the expanded slots (2026-07-17): true center */}
      <Pressable onPress={onPress} hitSlop={4}>
        <CrewName
          text={name}
          color={
            light
              ? active
                ? NAME_INK_ACTIVE
                : NAME_INK
              : active
                ? '#EAF4FF'
                : 'rgba(234,244,255,0.4)'
          }
        />
      </Pressable>
    </Animated.View>
  );
}

export default CrewSwitch;
