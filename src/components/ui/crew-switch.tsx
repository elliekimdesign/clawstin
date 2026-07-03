import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CREW_LIST, CrewKey } from '@/mock/crew-routing';
import { colors, fontFamily, fontSize, spacing } from '@/theme/theme';

const PILL_H = 40;
const SLOT_W = 92; // per-name slot width in the underlying (collapsed) strip
// White highlight is a FIXED medium size — sized for the longest name
// ("Researcher") so every crew sits centered in the same constant box,
// never stretching per-name. The outer gray pill hugs it closely, leaving
// just enough margin for a small legible peek on each side.
const CENTER_W = 104;
const PILL_W = CENTER_W + 44;
// Header side columns (back arrow / matching spacer) the pill must clear —
// mirrors the fixed 42px columns in chat/[id].tsx's header layout.
const HEADER_SIDE_W = 42;
// One smooth glide with barely-there overshoot — no jitter.
const SLIDE_SPRING = { damping: 22, stiffness: 250, mass: 0.9 };
const EXTEND_SPRING = { damping: 22, stiffness: 220, mass: 0.9 };

/**
 * Picker-wheel crew indicator: ONE fixed white pill at top-center; the crew
 * NAME cycles through it (Researcher → Scheduler → Scribe…) while routing is
 * "thinking," landing on whoever actually picks up the request. Neighbors
 * peek faded on either side, like a horizontal iOS picker wheel — not a
 * segmented bar with a sliding highlight between fixed positions.
 */
export function CrewSwitch({
  selected,
  manual: _manual,
  busy: _busy,
  onSelect,
}: {
  selected: CrewKey | null;
  manual: boolean;
  // Not read here anymore — the store's Transition Hold sequence (respond())
  // now owns all pacing between crews; this component just renders whatever
  // `selected` currently is. Kept in the prop signature for call-site parity.
  busy: boolean;
  onSelect: (key: CrewKey) => void;
}) {
  const { width: winW } = useWindowDimensions();
  // Expanded pill must fit within the header's center column (screen width
  // minus the two fixed 42px side columns + outer padding) — shrink each
  // slot proportionally if 5 names at full SLOT_W would overflow.
  const maxExpandedW = winW - 2 * HEADER_SIDE_W - 2 * spacing.md;
  const naturalExpandedW = SLOT_W * CREW_LIST.length;
  const expandedPillW = Math.min(naturalExpandedW, maxExpandedW);
  const expandedSlotW = expandedPillW / CREW_LIST.length;

  const [expanded, setExpanded] = useState(false);
  const strip = useSharedValue(0); // -index * slotW(state), offset so `selected` centers
  const stripOpacity = useSharedValue(1);
  const pillW = useSharedValue(PILL_W);
  const slotW = useSharedValue(SLOT_W);
  const expandT = useSharedValue(0); // 0 = collapsed reel, 1 = expanded list
  const positioned = useRef(false);

  const indexOf = (key: CrewKey | null) =>
    key ? CREW_LIST.findIndex((c) => c.key === key) : -1;

  // Pure "render whatever `selected` is" — all pacing (how long each crew
  // is shown before the next one) is decided upstream in the store's
  // Transition Hold sequence, not here. Adjacent crews (e.g. Researcher <->
  // Scribe) glide with a physical slide. Non-adjacent jumps (e.g. Operator
  // -> Scheduler) would otherwise visually SWEEP PAST whichever crew sits
  // between them in CREW_LIST — a crew that was never actually selected —
  // so those cross-fade instead: fade out, snap position, fade back in.
  useEffect(() => {
    const i = indexOf(selected);
    if (i < 0) return; // stay put
    const target = -i * slotW.value;

    if (!positioned.current) {
      strip.value = target;
      positioned.current = true;
      return;
    }

    const fromIndex = -strip.value / slotW.value;
    const distance = Math.abs(i - fromIndex);

    if (expanded || distance <= 1) {
      strip.value = withSpring(target, SLIDE_SPRING);
    } else {
      stripOpacity.value = withTiming(0, { duration: 160 }, (finished) => {
        if (finished) {
          strip.value = target;
          stripOpacity.value = withTiming(1, { duration: 220 });
        }
      });
    }
  }, [selected, strip, stripOpacity, expanded, slotW]);

  // Long-press expands the SAME gray pill wide enough to show every crew
  // name at once (active one still centered under the white highlight,
  // clamped to fit the header so it never overflows the screen) — no
  // separate floating dropdown. Tapping a name selects it and collapses.
  useEffect(() => {
    const targetPillW = expanded ? expandedPillW : PILL_W;
    const targetSlotW = expanded ? expandedSlotW : SLOT_W;
    pillW.value = withSpring(targetPillW, EXTEND_SPRING);
    slotW.value = withSpring(targetSlotW, EXTEND_SPRING);
    expandT.value = withTiming(expanded ? 1 : 0, { duration: 220 });
    // Re-center on the currently selected crew using the new slot width.
    const i = indexOf(selected);
    if (i >= 0) strip.value = withSpring(-i * targetSlotW, EXTEND_SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, expandedPillW, expandedSlotW]);

  const pillStyle = useAnimatedStyle(() => ({ width: pillW.value }));
  const centerStyle = useAnimatedStyle(() => ({
    left: pillW.value / 2 - CENTER_W / 2,
  }));
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: strip.value + pillW.value / 2 - slotW.value / 2 }],
    opacity: stripOpacity.value,
  }));

  return (
    <View style={{ height: PILL_H, alignItems: 'center' }}>
      {expanded ? (
        <Pressable
          onPress={() => setExpanded(false)}
          style={{ position: 'absolute', top: -1000, left: -1000, right: -1000, height: 3000, zIndex: 1 }}
        />
      ) : null}
      <Animated.View
        style={[
          {
            height: PILL_H,
            borderRadius: 999,
            backgroundColor: 'rgba(22,24,29,0.035)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.5)',
            overflow: 'hidden',
            zIndex: 2,
          },
          pillStyle,
        ]}>
        {/* White glass window under the active name — centers within
            whatever the pill's current (animated) width is. */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 3,
              width: CENTER_W,
              height: PILL_H - 6,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.85)',
              shadowColor: '#1B1F3B',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 1,
            },
            centerStyle,
          ]}
        />

        {/* Strip of every crew name; collapsed = only the centered one
            reads full-strength (picker-wheel peek); expanded = all names
            visible together, active one still centered. */}
        <Animated.View
          style={[
            { flexDirection: 'row', height: PILL_H, alignItems: 'center' },
            stripStyle,
          ]}>
          {CREW_LIST.map((c, idx) => (
            <ReelLabel
              key={c.key}
              name={c.name}
              idx={idx}
              strip={strip}
              slotW={slotW}
              expandT={expandT}
              active={c.key === selected}
              onPress={() => {
                onSelect(c.key);
                setExpanded(false);
              }}
            />
          ))}
        </Animated.View>

        <Pressable
          onLongPress={() => setExpanded((v) => !v)}
          delayLongPress={280}
          disabled={expanded}
          style={{ position: 'absolute', left: 0, top: 0, width: PILL_W, height: PILL_H }}
        />
      </Animated.View>
    </View>
  );
}

/** One name in the reel strip; fades/shrinks by distance from center when
 * collapsed, reads at full strength for everyone once expanded. Width
 * tracks the shared `slotW` so slots narrow together if 5 names need to
 * fit an expanded pill that's been clamped to the screen. */
function ReelLabel({
  name,
  idx,
  strip,
  slotW,
  expandT,
  active,
  onPress,
}: {
  name: string;
  idx: number;
  strip: SharedValue<number>;
  slotW: SharedValue<number>;
  expandT: SharedValue<number>;
  active: boolean;
  onPress: () => void;
}) {
  const outerStyle = useAnimatedStyle(() => ({ width: slotW.value }));
  const innerStyle = useAnimatedStyle(() => {
    // Distance (in slots) between this label and whichever slot is centered.
    const centeredIndex = -strip.value / slotW.value;
    const dist = Math.abs(idx - centeredIndex);
    const collapsedOpacity = interpolate(dist, [0, 1, 2], [1, 0.35, 0], 'clamp');
    const collapsedScale = interpolate(dist, [0, 1, 2], [1, 0.86, 0.75], 'clamp');
    const opacity = collapsedOpacity + (1 - collapsedOpacity) * expandT.value;
    const scale = collapsedScale + (1 - collapsedScale) * expandT.value;
    return { opacity, transform: [{ scale }] };
  });
  return (
    <Animated.View
      style={[{ height: PILL_H, alignItems: 'center', justifyContent: 'center' }, outerStyle]}>
      <Animated.View style={innerStyle}>
        <Pressable onPress={onPress} hitSlop={4}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: fontSize.small,
              fontFamily: active ? fontFamily.semibold : fontFamily.medium,
              color: active ? colors.text : colors.textSecondary,
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}>
            {name}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default CrewSwitch;
