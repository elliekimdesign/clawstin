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

// THE PANEL IS GONE from the expanded states (2026-07-25 "이 박스가 전체적으로
// 뭔가 거슬린데... 터미널 콘솔이 문제인가"): nested in the mast's pale glass, a
// near-black slab measured 54% of the mast's area at 5.7:1 against it — not a
// child panel but a hole punched through the glass, and the loudest object on
// the screen. The week strip hit this exact problem first (see week-strip.tsx:
// two dark panels stacking read as one black slab) and moved off this colour
// for the same reason.
//
// It SURVIVES for the folded square only: at 34px that's 7% of the mast area,
// where the same dark reads as a key rather than a slab — Home does the same
// with its 40px >_ chip ((tabs)/index.tsx).
const PANEL_BG = '#0E1626';
const MONO = fontFamily.mono;
// Ink, not white: the log now sits on the mast's own glass face, where the
// mast's title already uses this exact colour (5.6:1).
const TEXT = '#16181C';
const DIM = 'rgba(22,24,28,0.65)';
/** timing + step dots — deliberately the quietest thing in the row */
const FAINT = 'rgba(22,24,28,0.5)';
const HAIRLINE = 'rgba(22,24,28,0.1)';
// The verdict colours had to be REPLACED, not just reused. #7ED9A0 was tuned
// against near-black; on pale glass it measures 1.86:1, and every other green
// is worse (sysColor.ready 1.06, a deeper #2F7D53 1.58). A pastel cannot carry
// a signal on a light surface, so these are dark cuts of the same hues.
const WARN = '#8C3A28';
const OK = '#1E5B37';
/** the folded square keeps its dark face, so its glyphs stay light */
const OK_ON_DARK = '#7ED9A0';
const WARN_ON_DARK = '#F0B25F';

/** log lines display sentence-cased ("Parse & plan…") — the data stays
 * lowercase mono-speak, only the first glyph dresses up */
const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Log lines arrive as `stage  detail  timing`, double-space separated (see
 * app-store's runThinking calls). Splitting them lets each part be STYLED
 * rather than run together as one grey string (2026-07-25 "여기가 더
 * 유저프랜들리해야할거같아") — the stage becomes a quiet label, the detail
 * carries the weight, and the timing sits right-aligned out of the way.
 */
function parseLine(line: string): { stage?: string; detail: string; ms?: string } {
  const parts = line.split(/\s{2,}/).filter(Boolean);
  const last = parts[parts.length - 1] ?? '';
  const ms = /^[\d.]+m?s$/i.test(last) ? (parts.pop() as string) : undefined;
  // A line with no stage/detail split is a plain sentence (the gateway boot
  // lines: "Gateway connected | E2E Encrypted."). Those are the CONTENT, not
  // a stage name — labelling them would shout a whole sentence in caps.
  if (parts.length < 2) return { detail: parts[0] ?? line, ms };
  const stage = parts.shift() as string;
  return { stage, detail: parts.join(' '), ms };
}

/** One step: a small dot, the stage label, its detail, and the timing. */
function LogRow({ line }: { line: string }) {
  const { stage, detail, ms } = parseLine(line);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
      {/* the step marker — a quiet tick down the left, so the rows read as a
          SEQUENCE rather than a wall of text. Aligned to the STAGE label's
          cap height, not the row's centre. */}
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: FAINT,
          marginTop: 5,
          marginRight: 9,
        }}
      />
      <View style={{ flex: 1 }}>
        {/* the DETAIL is what you actually want to read ("Calendar, checking
            conflicts") — it gets the bright ink. The stage name is scaffolding,
            so it drops to a small dim label above it. */}
        {stage ? (
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              letterSpacing: 0.8,
              lineHeight: 13,
              color: DIM,
            }}>
            {stage.toUpperCase()}
          </Text>
        ) : null}
        <Text style={{ fontFamily: MONO, fontSize: 12.5, lineHeight: 18, color: TEXT }}>
          {cap1(detail)}
        </Text>
      </View>
      {ms ? (
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 11,
            lineHeight: 17,
            color: FAINT,
            marginLeft: 8,
          }}>
          {ms}
        </Text>
      ) : null}
    </View>
  );
}

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
  compactDock,
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
  /** the folded chip rides INSIDE the prompt mast now (2026-07-24), where
   * the composer-sized 48 square read far too heavy — this trims it to sit
   * on the mast's line like the composer's own mic does */
  compactDock?: boolean;
}) {
  if (!done) {
    // Rolling two-line ticker: only the latest lines, one line each.
    // The plate opens EMPTY at its full task-card size the instant a
    // send happens (2026-07-22 sequence: "빈 콘솔이... 프롬프트랑
    // 동시에") — steps then fill it in place, no growing jitter.
    const visible = lines.slice(-2);
    return (
      // no panel here either, so the console doesn't grow a black box the
      // moment a run starts and lose it again when the run lands
      <View style={{ minHeight: 62 }}>
        {/* same structured row as the finished log, so the console doesn't
            re-typeset itself the moment the run lands (2026-07-25) */}
        {visible.map((line) => (
          <Animated.View key={line} entering={FadeInDown.duration(240)}>
            <LogRow line={line} />
          </Animated.View>
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
      compactDock={compactDock}
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
  compactDock,
}: {
  threadId: string;
  lines: string[];
  failed?: boolean;
  startCollapsed?: boolean;
  foldedProp?: boolean;
  onToggleFold?: () => void;
  compactDock?: boolean;
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
    // FOLDED: asleep as a small dark square. Both states live in the prompt
    // mast now (2026-07-24) — this one on the ask's line at the right edge,
    // the expanded log directly below it in the same box.
    return (
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={({ pressed }) => ({
          // a SQUARE, not a full-width bar (2026-07-24 "접었을때 오른쪽
          // 네모로"): a whole row spent saying "Done" was too much for a
          // resting state. Inside the mast it trims to sit on the ask's line
          // like the composer's mic; standalone it keeps the 48 that matched
          // the white input field.
          width: compactDock ? 34 : 48,
          height: compactDock ? 34 : 48,
          borderRadius: compactDock ? 10 : 13,
          backgroundColor: PANEL_BG,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}>
        {/* this face is still dark, so the glyph keeps the LIGHT verdict
            colours — the dark cuts used in the expanded log would disappear
            against #0E1626 */}
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: failed ? WARN_ON_DARK : OK_ON_DARK,
          }}>
          {failed ? '⚠' : '>_'}
        </Text>
      </Pressable>
    );
  }

  return (
    // NO PANEL: the steps render straight onto whatever surface holds them
    // (the mast's glass), the way pipeline-card.tsx renders its steps with no
    // card shell at all. The old nestedRadius prop went with it — with no
    // panel there is no corner to match.
    <Pressable onPress={toggle} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {clipped ? (
        <Text style={{ fontFamily: MONO, fontSize: 11, color: DIM, marginBottom: 4 }}>
          {`${lines.length - shown.length} earlier steps`}
        </Text>
      ) : null}
      {shown.map((line, i) => (
        <LogRow key={`${threadId}-${i}`} line={line} />
      ))}
      {/* the verdict is a CONCLUSION, so a hairline sets it off from the
          steps rather than letting it read as one more of them (2026-07-25) */}
      <View
        style={{
          height: 1,
          backgroundColor: HAIRLINE,
          marginTop: 2,
          marginBottom: 9,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: 0.3,
            color: failed ? WARN : OK,
          }}>
          {failed ? '⚠ Stopped' : '✓ Done'}
        </Text>
      </View>
    </Pressable>
  );
}

export default ThinkingConsole;
