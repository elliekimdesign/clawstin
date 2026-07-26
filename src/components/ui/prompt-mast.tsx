import { ReactNode, useEffect, useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { fontFamily } from '@/theme/theme';

const OPEN_TIMING = { duration: 300, easing: Easing.out(Easing.cubic) };

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
  below,
  onLayout,
}: {
  /** the ask this index is currently pointing at */
  prompt?: string;
  /** optional extra content under the label+prompt. The run console USED to
   * ride here (both folded and expanded); as of 2026-07-25 it lives down in
   * the thread instead, so this is currently unused by chat/[id].tsx and
   * kept only as a slot. */
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
    <View>
      {/* RIGHT-ALIGNED (2026-07-25 "오른쪽 정렬로 보여주는건 어때? 대답은
          왼쪽지금처럼하고"): your words hug the right edge, the crew's
          replies stay left — author by SIDE, the oldest convention in chat.
          It also means the label and the prompt read as one right-hand
          block instead of competing with the reply column below. */}
      <View
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: 10,
          alignItems: 'flex-end',
        }}>
        {/* THE LABEL is the whole idea (2026-07-25): a user should not have
            to infer from a shape what this band holds. Mono + caps + wide
            tracking is the machine-label voice used for every other section
            eyebrow in the app (GITHUB, SUGGESTED, PARSE & PLAN), so this
            reads as a section header rather than a piece of content. */}
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 9.5,
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.62)',
            marginBottom: 5,
          }}>
          YOUR PROMPT
        </Text>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 16,
            lineHeight: 22,
            textAlign: 'right',
            // regular, not medium (2026-07-25 "굵은글씨 말고 그냥 기본글씨"):
            // it is a quotation of what you typed, not a headline
            fontFamily: fontFamily.regular,
            // WHITE now, not ink: with the glass card gone these words sit
            // straight on the desk blue, where #16181C would sink
            color: '#FFFFFF',
          }}>
          {prompt}
        </Text>
      </View>
      {/* the divider between "your side" and the thread scrolling beneath.
          This is the ONLY chrome left — it does the job the card's whole
          border and blur used to do, with one line. */}
      <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.22)' }} />
      {below ? (
        <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 14 }}>
          {below}
        </View>
      ) : null}
    </View>
  );

  return (
    <View onLayout={onLayout}>
      <Animated.View style={[{ overflow: 'hidden' }, boxStyle]}>
        {/* NO CARD (2026-07-25 "저 박스가 눈에 거슬리는데... 아 여기 내
            프롬프트가 전부 오는곳이구나 하고 유저가 이해할수있게"): the glass
            box was asked to be three things at once — a content card, a
            scroll INDEX that swaps as you move, and the console's housing —
            and a card shape can only say the first. So the card is gone and
            the LABEL does the explaining: "YOUR PROMPT" is unambiguous in a
            way a rounded rectangle never was, and a section header is the
            honest shape for something that renames itself on scroll.
            One hairline below divides it from the thread sliding beneath. */}
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
