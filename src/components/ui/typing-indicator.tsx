import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { spacing } from '@/theme/theme';
import { ThinkingBlob } from './thinking-blob';

/** The "thinking" beat between a sent message and its reply (2026-07-16,
 * three dots retired for a real metaballs-style blob — see
 * thinking-blob.tsx). Fades in/out so it never just snaps on/off. */
export function TypingIndicator() {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={{
        alignSelf: 'flex-start',
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
      }}>
      {/* bigger (2026-07-16, "이거 더 크게해줘") — was 34, the default */}
      <ThinkingBlob size={64} />
    </Animated.View>
  );
}

export default TypingIndicator;
