import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Same deep navy as every other system surface (home console, week strip).
const PANEL_BG = '#0E1626';
const MONO = 'Menlo';
const TEXT = 'rgba(255,255,255,0.72)';
const DIM = 'rgba(255,255,255,0.4)';

/** Breathing ellipsis while the agent is still working. */
function WorkingCursor() {
  const o = useSharedValue(0.25);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 500 }), withTiming(0.25, { duration: 500 })),
      -1
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.Text
      style={[{ fontFamily: MONO, fontSize: 12, lineHeight: 18, color: DIM }, style]}>
      {'…'}
    </Animated.Text>
  );
}

/**
 * Thinking Console — narrates the backend while the crew works. Running:
 * a thin two-line ticker (older lines roll out as new ones arrive). Done:
 * folds to a slim bar whose expand button drops the FULL untruncated log
 * down OVER the chat (an anchored dropdown, allowed to overlap).
 */
export function ThinkingConsole({
  threadId,
  lines,
  done,
}: {
  threadId: string;
  lines: string[];
  done: boolean;
}) {
  // Done logs open by default (2-3 lines, no harm) — the user can fold
  // them away with a tap if they want the space back.
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    setExpanded(true);
  }, [threadId, done]);

  if (!done) {
    // Rolling two-line ticker: only the latest lines, one line each.
    const visible = lines.slice(-2);
    return (
      <View
        style={{
          backgroundColor: PANEL_BG,
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        {visible.map((line) => (
          <Animated.Text
            key={line}
            entering={FadeInDown.duration(240)}
            numberOfLines={1}
            style={{ fontFamily: MONO, fontSize: 12, lineHeight: 18, color: TEXT }}>
            {line}
          </Animated.Text>
        ))}
        <WorkingCursor />
      </View>
    );
  }

  // ONE element, two sizes: the bar expands in place (the chat below is
  // pushed, not covered) and folds back on tap.
  if (!expanded) {
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        style={({ pressed }) => ({
          backgroundColor: PANEL_BG,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: pressed ? 0.8 : 1,
        })}>
        <Text style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>
          {'✓ done · '}
          {lines.length}
          {lines.length === 1 ? ' step' : ' steps'}
        </Text>
        <Ionicons name="chevron-down" size={12} color={DIM} />
      </Pressable>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(200)}>
      <Pressable
        onPress={() => setExpanded(false)}
        style={{
          backgroundColor: PANEL_BG,
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        {lines.map((line, i) => (
          <Text
            key={`${threadId}-${i}`}
            style={{
              fontFamily: MONO,
              fontSize: 12,
              lineHeight: 18,
              color: TEXT,
              marginBottom: 4,
            }}>
            {line}
          </Text>
        ))}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 2,
          }}>
          <Text style={{ fontFamily: MONO, fontSize: 11, color: DIM }}>{'✓ done'}</Text>
          <Ionicons name="chevron-up" size={12} color={DIM} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default ThinkingConsole;
