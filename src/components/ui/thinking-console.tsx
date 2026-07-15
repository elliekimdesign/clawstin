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
// clean runs close in success green (user's instinct 2026-07-14: the
// verdict line's position was right, its color was the missing signal)
const OK = '#7ED9A0';

/** log lines display sentence-cased ("Parse & plan…") — the data stays
 * lowercase mono-speak, only the first glyph dresses up */
const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

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
  folded: foldedProp,
  onToggleFold,
}: {
  threadId: string;
  lines: string[];
  done: boolean;
  /** the run stopped on errors — amber "stopped" footer instead of done */
  failed?: boolean;
  /** for logs of runs that finished BEFORE the user arrived (seeded
   * ask-threads): start as the folded circle */
  startCollapsed?: boolean;
  /** controlled fold: the chat screen owns placement (expanded log up
   * top vs the docked circle above the composer), so it owns the state */
  folded?: boolean;
  onToggleFold?: () => void;
}) {
  if (!done) {
    // Rolling two-line ticker: only the latest lines, one line each.
    const visible = lines.slice(-2);
    return (
      <View
        style={{
          backgroundColor: PANEL_BG,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        {visible.map((line) => (
          <Animated.Text
            key={line}
            entering={FadeInDown.duration(240)}
            numberOfLines={1}
            style={{ fontFamily: MONO, fontSize: 12, lineHeight: 18, color: TEXT }}>
            {cap1(line)}
          </Animated.Text>
        ))}
        <WorkingCursor />
      </View>
    );
  }

  // Two states (2026-07-14 rework): the full log IS the minimum — the
  // old one-line "✓ Done N steps" bar is gone. Folding turns the whole
  // console into a small circle at the right edge (under the header's
  // calendar circle); tapping the circle brings the log back.
  return (
    <DoneLog
      threadId={threadId}
      lines={lines}
      failed={failed}
      startCollapsed={startCollapsed}
      foldedProp={foldedProp}
      onToggleFold={onToggleFold}
    />
  );
}

function DoneLog({
  threadId,
  lines,
  failed,
  startCollapsed,
  foldedProp,
  onToggleFold,
}: {
  threadId: string;
  lines: string[];
  failed?: boolean;
  startCollapsed?: boolean;
  foldedProp?: boolean;
  onToggleFold?: () => void;
}) {
  const { height: winH } = useWindowDimensions();
  const [foldedLocal, setFoldedLocal] = useState(!!startCollapsed);
  const folded = foldedProp ?? foldedLocal;
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    if (onToggleFold) onToggleFold();
    else setFoldedLocal((v) => !v);
  };
  // quarter view: as many of the LATEST lines as fit in screenH/4
  const LINE_H = 22;
  const cap = Math.max(2, Math.floor((winH / 4 - 60) / LINE_H));
  const shown = lines.slice(-cap);
  const clipped = lines.length > shown.length;

  if (folded) {
    // the console asleep: a navy circle riding the empty right edge,
    // '>_' in the run's verdict color; tap to reopen the log
    return (
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={({ pressed }) => ({
          alignSelf: 'flex-end',
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: PANEL_BG,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}>
        <Text style={{ fontFamily: MONO, fontSize: 12, color: failed ? WARN : OK }}>
          {failed ? '⚠' : '>_'}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => ({
        backgroundColor: PANEL_BG,
        borderRadius: 16,
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
          {cap1(line)}
        </Text>
      ))}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 2,
        }}>
        <Text style={{ fontFamily: MONO, fontSize: 11, color: failed ? WARN : OK }}>
          {failed ? '⚠ Stopped' : '✓ Done'}
        </Text>
      </View>
    </Pressable>
  );
}

export default ThinkingConsole;
