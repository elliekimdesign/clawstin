import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { ReactNode, useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { fontFamily } from '@/theme/theme';

const OPEN_TIMING = { duration: 300, easing: Easing.out(Easing.cubic) };

/** Liquid Glass is iOS 26+; the white veil under it is the fallback. */
const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

/**
 * The PROMPT MAST — an INDEX, not a transcript (2026-07-24 "그게 인덱스라서
 * 스크롤 내릴때... 하나씩만"): it names the ONE ask whose answer you're
 * currently reading, pinned in the band between the crew pill and the
 * console, and swaps as you scroll — like a sticky section header.
 *
 * It started life stacking every ask in the task at once. That made the top
 * of the screen grow without bound and duplicated the gray prompt lines in
 * the thread; showing a single entry is what lets both exist.
 *
 * The box still animates its own height, so a longer or shorter ask
 * stretches it rather than snapping.
 */
export function PromptMast({
  prompt,
  blob,
  dock,
  below,
  onLayout,
}: {
  /** the ask this index is currently pointing at */
  prompt?: string;
  /** the at-rest ThinkingBlob, riding beside the ask (2026-07-24) */
  blob?: ReactNode;
  /** the FOLDED console: a small square on the mast's right edge, riding the
   * ask's own line (2026-07-24 "접었을때 오른쪽 네모로"). The full-width
   * one-line bar this replaced took a whole row to say "Done". */
  dock?: ReactNode;
  /** the EXPANDED console, opening downward inside the box on the shared
   * text column */
  below?: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  // Measured content height drives the animated box height: we let the
  // real text lay out once (invisibly, at auto height), then glide the
  // visible box to that number. Height can't animate from/to 'auto'.
  const [contentH, setContentH] = useState(0);
  const h = useSharedValue(0);
  // first paint shouldn't animate up from 0 — only later changes should
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!contentH) return;
    if (!settled) {
      h.value = contentH;
      setSettled(true);
      return;
    }
    h.value = withTiming(contentH, OPEN_TIMING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentH, settled]);

  const boxStyle = useAnimatedStyle(() => ({
    height: settled ? h.value : undefined,
  }));

  if (!prompt) return null;

  // Sized to the COMPOSER's own input line (2026-07-24 "이거랑 똑같이"):
  // 16/22, the size you typed the words at, so the pinned ask and the field
  // it came from speak at one scale. Weight stays medium — the marquee still
  // outranks the thread's replies, it just does it with weight and the taller
  // box rather than by being a size of its own.
  const body = (
    // The shared text column (34) is set by the REPLY's own geometry — face
    // chip (26) + gap (8) — because a speaker mark can't be dragged to the
    // screen edge without looking cramped. So the mast's words move right to
    // meet the replies, not the other way round.
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          // the reply row's own gap, so the text lands on the same column
          gap: 8,
          // the orb takes the FACE's slot when present (2026-07-24 "글시작
          // 점 왼쪽에 두라고 크루 얼굴나오는거처럼"): on replies a crew face
          // marks who spoke, so on the mast the orb marks "this is the part
          // YOU typed". Same 34px column either way — the orb supplies it
          // when it's there, padding when it isn't.
          // 4 + slot 22 + gap 8 = the 34 column (measured on device
          // 2026-07-24: at pad 8 / slot 26 the text landed on 42, nine px
          // right of every other line). A small pad keeps the orb off the
          // glass edge; the orb runs a touch smaller than the crew face,
          // which is right — it's a status mark, not a portrait.
          paddingLeft: blob ? 4 : 34,
          // Matched to the COMPOSER's input row (2026-07-24 "사이즈가 전체적
          // 으로 너무 큰거같아... 여기 느낌이랑 비슷하게"): same 52 min height
          // and the same tight right inset the mic keeps, so the pinned ask
          // and the field it came from are one size. paddingVertical 14 made
          // the box read much taller than the composer at the same type size.
          paddingRight: dock ? 8 : 16,
          minHeight: 52,
          paddingVertical: 10,
        }}>
        {/* the speaker mark for YOUR side. Its canvas draws the orb inset, so
            it's given a 22 footprint with the overflow bleeding symmetrically
            outside it. */}
        {blob ? (
          <View
            style={{
              width: 22,
              height: 22,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {blob}
          </View>
        ) : null}
        <Text
          numberOfLines={2}
          style={{
            flex: 1,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fontFamily.medium,
            color: '#16181C',
          }}>
          {prompt}
        </Text>
        {/* folded: the small square rides the ask's own line */}
        {dock ? <View style={{ marginLeft: 10 }}>{dock}</View> : null}
      </View>
      {/* the console opens downward INSIDE the box, starting on the SAME
          left edge as the ask above it and as the cards down in the thread
          (2026-07-24 "여기 시작하는거랑 똑같이"): it was hugging the mast's
          outer edge, so it started left of every other block on screen and
          broke the single text column. */}
      {below ? (
        <View style={{ paddingLeft: 34, paddingRight: 16, paddingBottom: 14 }}>
          {below}
        </View>
      ) : null}
    </View>
  );

  return (
    <View onLayout={onLayout}>
      <Animated.View
        style={[
          {
            // the input box's curve — every white glass box here shares it
            borderRadius: 13,
            overflow: 'hidden',
          },
          boxStyle,
        ]}>
        {/* THE CREW PILL'S OWN MATERIAL (2026-07-24 "이런 배경으로"): the
            solid white panel read as a foreign slab on the blue desk, so the
            mast now wears exactly what the header pill above it wears —
            Apple's clear Liquid Glass over a 14% white veil, gated because
            the glass API is iOS 26+ and the veil is also the fallback.
            The text stays DARK: on this face ink measures 5.6:1 against
            white's 3.1:1, so the translucency costs nothing in legibility.
            The occluder plate behind the mast (see chat/[id].tsx) is what
            keeps the scrolling thread from showing through now that this
            face is no longer opaque. */}
        {GLASS_AVAILABLE ? (
          <GlassView
            glassEffectStyle="clear"
            colorScheme="light"
            style={[StyleSheet.absoluteFill, { borderRadius: 13 }]}
            pointerEvents="none"
          />
        ) : null}
        {/* noRim (2026-07-24 "아웃라인없애고 배경 지금처럼 블러로만"): the
            white hairline drew a hard edge around a surface whose whole point
            is softness — the blur alone now says "this is a pane". */}
        <FrostedGlassFill flat noRim radius={13} tint="rgba(255,255,255,0.14)" />
        {/* keyed on the text so a swap cross-fades instead of hard-cutting */}
        <Animated.View key={prompt} entering={FadeIn.duration(180)}>
          {body}
        </Animated.View>
      </Animated.View>
      {/* invisible measuring twin at natural height: gives the animation
          a real target number without ever showing a second box */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, opacity: 0, zIndex: -1 }}
        onLayout={(e) => {
          const next = Math.ceil(e.nativeEvent.layout.height);
          if (next && next !== contentH) setContentH(next);
        }}>
        {body}
      </View>
    </View>
  );
}

export default PromptMast;
