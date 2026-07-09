import { Ionicons } from '@expo/vector-icons';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  Image,
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

import { CREW_LIST, CrewKey } from '@/mock/crew-routing';
import { darkChat, fontFamily, fontSize, spacing } from '@/theme/theme';

const PILL_H = 40;
const SLOT_W = 92; // per-name slot width in the underlying (collapsed) strip

// Round crew avatars (same face-centered card assets as the other tabs).
const CREW_ART: Record<CrewKey, ImageSourcePropType> = {
  researcher: require('../../../assets/crew/beaker.jpeg'),
  writer: require('../../../assets/crew/misspiggy.jpeg'),
  triage: require('../../../assets/crew/gonzo.jpeg'),
  orchestrator: require('../../../assets/crew/muppet.jpeg'),
};

/** Small round crew face chip. */
function CrewAvatar({ src, size = 18 }: { src: ImageSourcePropType; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}>
      <Image source={src} style={{ width: size, height: size, resizeMode: 'cover' }} />
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
const CENTER_W = 124;
const PILL_W = CENTER_W + 2 * RING;
// One smooth glide with barely-there overshoot — no jitter.
const SLIDE_SPRING = { damping: 24, stiffness: 220, mass: 0.9 };
const EXTEND_SPRING = { damping: 24, stiffness: 200, mass: 0.9 };
// Cross-fade between the collapsed reel and the expanded row.
const FADE_TIMING = { duration: 240, easing: Easing.out(Easing.cubic) };

// expo-glass-effect is iOS-only and can be unavailable on some iOS 26 betas —
// guard so the pill still renders (via the rgba fallback below) everywhere else.
const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

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
}) {
  const { width: winW } = useWindowDimensions();
  // Expanded pill's max width: nearly the full screen — the header's side
  // buttons hide while expanded, so only the outer margins are reserved.
  // The row scrolls internally if the crew names need more space than this.
  const maxExpandedW = winW - 2 * spacing.md;

  const [expanded, setExpanded] = useState(false);
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
    () => CREW_LIST.map((c) => Math.max(SLOT_W * 0.72, c.name.length * 9.5 + 28)),
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
      : PILL_W;
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
  }, [expanded, maxExpandedW]);

  const pillStyle = useAnimatedStyle(() => ({ width: pillW.value }));
  const collapsedCenterStyle = useAnimatedStyle(() => ({
    left: (pillW.value - 2 * BORDER) / 2 - CENTER_W / 2,
  }));
  const expandedHighlightStyle = useAnimatedStyle(() => ({
    width: highlightW.value,
    transform: [{ translateX: highlightLeft.value }],
  }));
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

  const GlassOrFallback = GLASS_AVAILABLE ? GlassView : View;

  return (
    <View style={{ height: PILL_H, alignItems: 'center' }}>
      {expanded ? (
        <Pressable
          onPress={closePanel}
          style={{ position: 'absolute', top: -1000, left: -1000, right: -1000, height: 3000, zIndex: 1 }}
        />
      ) : null}
      <Animated.View style={[{ borderRadius: 999, overflow: 'hidden', zIndex: 2 }, pillStyle]}>
        <GlassOrFallback
          {...(GLASS_AVAILABLE
            ? { glassEffectStyle: 'regular' as const, isInteractive: true, colorScheme: 'dark' as const }
            : {})}
          style={{
            height: PILL_H,
            borderRadius: 999,
            // the track behind the capsule wears the command azure's
            // deep ink (translucent over glass) instead of dull slate
            backgroundColor: GLASS_AVAILABLE ? 'rgba(255,255,255,0.55)' : darkChat.solidSurface,
            borderWidth: BORDER,
            // brighter neutral white: at low opacity the edge picked up a
            // pale-green cast from the teal gradient behind it
            borderColor: 'rgba(255,255,255,0.5)',
            overflow: 'hidden',
          }}>
          {/* Collapsed layer: fixed centered capsule + picker-wheel strip.
              Stays mounted and cross-fades out while the expanded row fades
              in, so open/close reads as one continuous morph. */}
          <Animated.View
            pointerEvents={expanded ? 'none' : 'auto'}
            style={[StyleSheet.absoluteFill, collapsedLayerStyle]}>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: RING - BORDER,
                  width: CENTER_W,
                  height: PILL_H - 2 * RING,
                  borderRadius: 999,
                  // the command bar's azure: selection = the action
                  // color. A green hairline = manually pinned.
                  backgroundColor: '#4285F4',
                  borderWidth: manual && selected !== null ? 1 : 0,
                  borderColor: 'rgba(95,217,164,0.65)',
                  shadowColor: '#1B1F3B',
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 1,
                },
                collapsedCenterStyle,
              ]}
            />
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
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                {selected === null ? (
                  <MiniFace size={16} />
                ) : (
                  <CrewAvatar src={CREW_ART[selected]} size={18} />
                )}
                <Text
                  style={{
                    fontSize: fontSize.small,
                    fontFamily: fontFamily.semibold,
                    color: darkChat.onLight,
                    includeFontPadding: false,
                  }}>
                  {selected === null
                    ? 'New Chat'
                    : CREW_LIST.find((c) => c.key === selected)?.name}
                </Text>
                {/* pinned manually: the ✕ says "tap to release to auto" */}
                {manual && selected !== null ? (
                  <Ionicons name="close" size={13} color={darkChat.onLight} />
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
                {/* Highlight capsule — position AND width glide to whichever
                    name is selected, same "selected = capsule" language as
                    the collapsed reel, now tracking a scrollable row. */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: 'absolute',
                      top: RING - BORDER,
                      height: PILL_H - 2 * RING,
                      borderRadius: 999,
                      // same command azure as the collapsed capsule
                      backgroundColor: '#4285F4',
                      shadowColor: '#1B1F3B',
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 1 },
                      elevation: 1,
                    },
                    expandedHighlightStyle,
                  ]}
                />

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
                        opacity: pressed ? 0.6 : 1,
                      })}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: fontSize.small,
                          fontFamily: c.key === selected ? fontFamily.semibold : fontFamily.medium,
                          color: c.key === selected ? darkChat.onLight : darkChat.textSecondary,
                          includeFontPadding: false,
                          textAlignVertical: 'center',
                        }}>
                        {c.name}
                      </Text>
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
              style={{ position: 'absolute', left: 0, top: 0, width: PILL_W, height: PILL_H }}
            />
          ) : null}
        </GlassOrFallback>
      </Animated.View>
    </View>
  );
}

/** The little round orange face (the app's orchestrator mark), sized for
 * the pill's New Chat badge. */
function MiniFace({ size = 16 }: { size?: number }) {
  const k = size / 34;
  return (
    <View
      style={{
        width: size,
        height: size,
        // the app-icon squircle, same as the home console's face
        borderRadius: size * 0.3,
        backgroundColor: '#E8563F',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View style={{ flexDirection: 'row', gap: 6 * k, marginBottom: 4 * k }}>
        <View
          style={{ width: 4.5 * k, height: 4.5 * k, borderRadius: 999, backgroundColor: '#FFFFFF' }}
        />
        <View
          style={{ width: 4.5 * k, height: 4.5 * k, borderRadius: 999, backgroundColor: '#FFFFFF' }}
        />
      </View>
      <View
        style={{
          width: 11 * k,
          height: 2.5 * k,
          borderRadius: 2 * k,
          backgroundColor: 'rgba(255,255,255,0.9)',
        }}
      />
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
}: {
  name: string;
  idx: number;
  strip: SharedValue<number>;
  active: boolean;
  onPress: () => void;
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
      <Pressable onPress={onPress} hitSlop={4}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: fontSize.small,
            fontFamily: active ? fontFamily.semibold : fontFamily.medium,
            color: active ? darkChat.onLight : darkChat.textSecondary,
            includeFontPadding: false,
            textAlignVertical: 'center',
          }}>
          {name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default CrewSwitch;
