import { useEffect, useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { fontFamily } from '@/theme/theme';

// Same deep navy as every other system surface (home console, week strip).
const PANEL_BG = '#0E1626';
const MONO = fontFamily.mono;
const TEXT = 'rgba(255,255,255,0.72)';
const DIM = 'rgba(255,255,255,0.4)';
// runs that STOPPED on errors close amber, not green (Logs `wait` tone)
const WARN = '#F0B25F';

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
 * a thin two-line ticker (older lines roll out as new ones arrive).
 * Done (2026-07-12, no fold buttons): the log shows at most a QUARTER
 * of the screen; tapping grows it to the full screen (scrollable), and
 * tapping again returns it to the quarter view.
 */
export function ThinkingConsole({
  threadId,
  lines,
  done,
  failed,
  startCollapsed,
}: {
  threadId: string;
  lines: string[];
  done: boolean;
  /** the run stopped on errors — amber "stopped" footer instead of done */
  failed?: boolean;
  /** for logs of runs that finished BEFORE the user arrived (seeded
   * ask-threads): fold to the slim bar, expand on demand */
  startCollapsed?: boolean;
}) {
  if (!done) {
    // Rolling two-line ticker: only the latest lines, one line each.
    const visible = lines.slice(-2);
    return (
      <View
        style={{
          backgroundColor: PANEL_BG,
          borderRadius: 20,
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

  // Two sizes, one element, no fold chrome: quarter-screen cap by
  // default, tap = the log takes the screen, tap again = back.
  return (
    <DoneLog threadId={threadId} lines={lines} failed={failed} />
  );
}

function DoneLog({
  threadId,
  lines,
  failed,
}: {
  threadId: string;
  lines: string[];
  failed?: boolean;
}) {
  const { height: winH } = useWindowDimensions();
  // ANY tap shortens: content (quarter-capped) <-> one slim line
  const [slim, setSlim] = useState(false);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    setSlim((v) => !v);
  };
  // quarter view: as many of the LATEST lines as fit in screenH/4
  const LINE_H = 22;
  const cap = Math.max(2, Math.floor((winH / 4 - 60) / LINE_H));
  const shown = lines.slice(-cap);
  const clipped = lines.length > shown.length;

  if (slim) {
    return (
      <Pressable
        onPress={toggle}
        style={({ pressed }) => ({
          backgroundColor: PANEL_BG,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
          opacity: pressed ? 0.92 : 1,
        })}>
        <Text style={{ fontFamily: MONO, fontSize: 11, color: failed ? WARN : DIM }}>
          {failed ? '⚠ stopped  ' : '✓ done  '}
          {lines.length}
          {lines.length === 1 ? ' step' : ' steps'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => ({
        backgroundColor: PANEL_BG,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        opacity: pressed ? 0.92 : 1,
      })}>
      {clipped ? (
        <Text style={{ fontFamily: MONO, fontSize: 11, color: DIM, marginBottom: 4 }}>
          {`${lines.length - shown.length} earlier steps`}
        </Text>
      ) : null}
      {shown.map((line, i) => (
        <Text
          key={`${threadId}-${i}`}
          style={{ fontFamily: MONO, fontSize: 12, lineHeight: 18, color: TEXT, marginBottom: 4 }}>
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
        <Text style={{ fontFamily: MONO, fontSize: 11, color: failed ? WARN : DIM }}>
          {failed ? '⚠ stopped' : '✓ done'}
        </Text>
      </View>
    </Pressable>
  );
}

export default ThinkingConsole;
