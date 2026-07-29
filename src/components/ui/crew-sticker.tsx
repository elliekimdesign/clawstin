import { View } from 'react-native';

import { CrewPixel } from '@/components/ui/crew-pixel';

/**
 * The proposing crew member's face, stuck on the end of their sentence
 * (2026-07-29 "누가 제안하는건지 얼굴이 있으면 더 재밌고 신뢰가 가기 때문에").
 *
 * Tilted a few degrees like a sticker pressed on by hand, so it reads as
 * someone signing their suggestion rather than as another UI chip. The
 * board's rows are otherwise markless by design (2026-07-28) — this is the
 * one exception, and it earns it by answering "who is asking me this".
 */

/** a few degrees off-axis: enough to read as placed, not as misaligned */
const TILT = '-7deg';

export function CrewSticker({
  agentId,
  size = 24,
  /** rendered INSIDE a Text run, so it lands on the last line right after
   * the final word instead of floating at the end of the block. iOS needs
   * the nudge below to sit the box on the text's baseline. */
  inline = false,
}: {
  agentId: string;
  size?: number;
  inline?: boolean;
}) {
  return (
    <View
      style={{
        // the plate FOLLOWS THE FACE (2026-07-29 "덧댄 색깔을 그대로 페이스
        // 원형까지만"): a square tile framed the head like a badge, so the
        // backing is now a circle sized to the face itself. Same quiet
        // tone, no visible container — it reads as the head's own edge.
        width: size + 4,
        height: size + 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        // ONE transform: a second `transform` key would overwrite the
        // tilt, so the inline baseline nudge composes with it here
        // the nudge shrinks with the face (2026-07-29 "같은 라인 느낌"): a
        // smaller plate needs less drop to share the text's baseline
        transform: inline
          ? [{ translateY: Math.round(size * 0.22) }, { rotate: TILT }]
          : [{ rotate: TILT }],
      }}>
      <CrewPixel id={agentId} size={size} />
    </View>
  );
}

export default CrewSticker;
