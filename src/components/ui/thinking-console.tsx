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

import { fontFamily, sysColor } from '@/theme/theme';

import { ThinkingBlob } from './thinking-blob';

// THE PANEL IS GONE from the expanded states (2026-07-25 "이 박스가 전체적으로
// 뭔가 거슬린데... 터미널 콘솔이 문제인가"): nested in the mast's pale glass, a
// near-black slab measured 54% of the mast's area at 5.7:1 against it — not a
// child panel but a hole punched through the glass, and the loudest object on
// the screen. The week strip hit this exact problem first (see week-strip.tsx:
// two dark panels stacking read as one black slab) and moved off this colour
// for the same reason.
//
// The folded chip kept it longest, but on 2026-07-25 that went too: the chip
// now wears sysColor.accent like every other button in the app.
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
/** the folded square keeps its dark face, so its ⚠ stays light. The OK
 * counterpart went away with the >_ glyph — a healthy run shows the
 * ThinkingBlob there now (2026-07-25), which carries its own colour. */
const WARN_ON_DARK = '#F0B25F';

/* ON THE BLUE DESK (2026-07-25 "리즈닝 부분이 눈에 보이는색으로 근데
   완전힌색말고 밝은 회색정도로"): when the console renders in the THREAD
   rather than inside the mast, it sits on the desk blue, where every ink
   value above goes nearly invisible. These are its light counterparts —
   deliberately NOT pure white: a bright gray reads as a machine readout,
   while #FFF would out-shout the agent's actual reply below it. */
// ON THE PALE MOSAIC FIELD (2026-07-25): ink, because the field was lifted to
// near-white and the old light set measured ~1.3:1 on it.
const TEXT_ON_DESK = '#16181C';
const DIM_ON_DESK = 'rgba(22,24,28,0.66)';
const FAINT_ON_DESK = 'rgba(22,24,28,0.5)';
// ON A DARK PANEL (2026-07-25): the run panel took the >_ key's near-black
// face, so the same three roles need their light cuts back.
const TEXT_ON_DARK = '#E4EBF3';
const DIM_ON_DARK = 'rgba(255,255,255,0.66)';
const FAINT_ON_DARK = 'rgba(255,255,255,0.46)';

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

/** One step: a small dot, the stage label, its detail, and the timing.
 * `onDesk` flips the palette light for the in-thread console, which sits
 * on the desk blue instead of the mast's pale glass (2026-07-25). */
function LogRow({
  line,
  onDesk,
  onDark,
}: {
  line: string;
  onDesk?: boolean;
  onDark?: boolean;
}) {
  const { stage, detail, ms } = parseLine(line);
  const cText = onDark ? TEXT_ON_DARK : onDesk ? TEXT_ON_DESK : TEXT;
  const cDim = onDark ? DIM_ON_DARK : onDesk ? DIM_ON_DESK : DIM;
  const cFaint = onDark ? FAINT_ON_DARK : onDesk ? FAINT_ON_DESK : FAINT;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
      {/* the step marker — a quiet tick down the left, so the rows read as a
          SEQUENCE rather than a wall of text. Aligned to the STAGE label's
          cap height, not the row's centre.
          ON DESK it is dropped entirely (2026-07-25 "저기 점들 대신 우리
          지웟던 그 움직이는 볼. 그거 위에 하나만 하고 점 세개 다 안해도돼"):
          one living blob to the LEFT of the whole list says "working"
          better than three static dots repeating down the side. No spacer
          is needed here — the blob's own column already indents the rows. */}
      {onDesk ? null : (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: cFaint,
            marginTop: 5,
            marginRight: 9,
          }}
        />
      )}
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
              color: cDim,
            }}>
            {stage.toUpperCase()}
          </Text>
        ) : null}
        <Text style={{ fontFamily: MONO, fontSize: 12.5, lineHeight: 18, color: cText }}>
          {cap1(detail)}
        </Text>
      </View>
      {ms ? (
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 11,
            lineHeight: 17,
            color: cFaint,
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
  reveal,
  revealMs,
  stepsOnly,
  onDark,
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
  /** in-thread console under your ask: steps appear one at a time */
  reveal?: boolean;
  revealMs?: number;
  /** step lines only, no hairline + verdict row */
  stepsOnly?: boolean;
  /** rendering on a DARK panel (the run panel wears the >_ key's near-black
   * face) — flips the palette light instead of ink (2026-07-25) */
  onDark?: boolean;
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
      reveal={reveal}
      revealMs={revealMs}
      stepsOnly={stepsOnly}
      onDark={onDark}
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
  reveal,
  revealMs = 700,
  stepsOnly,
  onDark,
}: {
  threadId: string;
  lines: string[];
  failed?: boolean;
  startCollapsed?: boolean;
  foldedProp?: boolean;
  onToggleFold?: () => void;
  compactDock?: boolean;
  /** reveal the steps ONE AT A TIME instead of all at once (2026-07-25
   * "천천히 한줄씩 나오는걸로만"). Used by the in-thread console under
   * your ask, where the point is watching the work happen; the mast's
   * copy leaves it off and shows the finished log immediately. */
  reveal?: boolean;
  /** ms between revealed steps when `reveal` is on */
  revealMs?: number;
  /** drop the trailing hairline + verdict row, leaving ONLY the step
   * lines — the in-thread console is a live readout, not a receipt */
  stepsOnly?: boolean;
  /** rendering on a DARK panel: flips the palette light instead of ink */
  onDark?: boolean;
}) {
  const { height: winH } = useWindowDimensions();
  const [foldedLocal, setFoldedLocal] = useState(!!startCollapsed);
  const folded = foldedProp ?? foldedLocal;
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    if (onToggleFold) onToggleFold();
    else setFoldedLocal((v) => !v);
  };
  // staged reveal: how many steps are allowed on screen so far
  const [revealed, setRevealed] = useState(reveal ? 1 : lines.length);
  useEffect(() => {
    if (!reveal) {
      setRevealed(lines.length);
      return;
    }
    if (revealed >= lines.length) return;
    const t = setTimeout(() => {
      // each new line slides in rather than popping
      LayoutAnimation.configureNext(
        LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'),
      );
      setRevealed((n) => n + 1);
    }, revealMs);
    return () => clearTimeout(t);
  }, [reveal, revealed, lines.length, revealMs]);

  // quarter view: as many of the LATEST lines as fit in screenH/4
  const LINE_H = 22;
  const cap = Math.max(2, Math.floor((winH / 4 - 60) / LINE_H));
  // when revealing, take the FIRST n (the work reads top-down as it
  // happens); otherwise keep the existing "latest that fit" window
  const pool = reveal ? lines.slice(0, revealed) : lines;
  const shown = reveal ? pool : pool.slice(-cap);
  const clipped = !reveal && lines.length > shown.length;

  if (folded) {
    // FOLDED: asleep as a small round button. Both states live in the prompt
    // mast now (2026-07-24) — this one on the ask's line at the right edge,
    // the expanded log directly below it in the same box.
    return (
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={({ pressed }) => {
          const d = compactDock ? 34 : 48;
          return {
            // A CIRCLE (2026-07-25 "뭔가 버튼 모양이 마음에안들어"): the
            // rounded square with a white outline read as an app ICON, and
            // its corners fought the round blob inside it. This header
            // already has two circular buttons (back, calendar, +) — the
            // console chip now joins them, so the row has one button shape.
            // The square era ran 2026-07-24 to 07-25.
            width: d,
            height: d,
            borderRadius: d / 2,
            // ON-PALETTE (2026-07-25 "우리 전체디자인이랑 맞는색"): the old
            // near-black face was a hole punched in the glass, left over from
            // the terminal era. sysColor.accent is the same blue every other
            // button in the app uses. No outline — the shadow alone lifts it
            // off the glass, and the press state sinks it.
            backgroundColor: sysColor.accent,
            shadowColor: '#0B2647',
            shadowOpacity: pressed ? 0.16 : 0.3,
            shadowRadius: pressed ? 3 : 7,
            shadowOffset: { width: 0, height: pressed ? 1 : 3 },
            elevation: pressed ? 1 : 4,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
          };
        }}>
        {/* THE BLOB, not a >_ glyph (2026-07-25 "이거마크를 thinking blob
            으로 바꾸기 안에 블랍넣기"): the resting chip holds the same
            living mark the expanded log leads with, so folded and open are
            visibly the same object. `bright` keeps the pale/mint stops,
            which still separate cleanly from the accent blue underneath.
            A FAILED run keeps the ⚠ glyph: a cheerful animated blob must
            never be the way a failure is reported. */}
        {failed ? (
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: WARN_ON_DARK,
            }}>
            ⚠
          </Text>
        ) : (
          /* bigger + lively (2026-07-25 "조금더 블랍을 크게하고 움직이는
             걸로"): 22 → 24 inside the 34 circle. It fills the face far
             more than the old 22 did, but stops short of the rim — in a
             CIRCLE (unlike the old square) a blob sized to the full width
             would clip against the curve as it breathes. */
          <ThinkingBlob size={compactDock ? 24 : 34} bright lively />
        )}
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
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: stepsOnly ? DIM_ON_DESK : DIM,
            marginBottom: 4,
          }}>
          {`${lines.length - shown.length} earlier steps`}
        </Text>
      ) : null}
      {/* ONE living blob BESIDE the run, text flowing to its right
          (2026-07-25 "thinkingblob 오른쪽으로 글이 오는거야"): it replaces
          the per-row dots entirely — the thing that moves is the thing
          that says "this is happening", and it only needs saying once.
          It was first stacked ABOVE the lines, which read as a stray mark
          floating over the log; as a left-hand column it speaks for the
          whole block, the way an avatar does for a message. Aligned to
          the FIRST line's cap height, not the block's centre, so it does
          not drift downward as steps arrive. */}
      {stepsOnly ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 20, marginRight: 9, marginTop: 1 }}>
            <ThinkingBlob size={20} />
          </View>
          <View style={{ flex: 1 }}>
            {shown.map((line, i) => (
              <LogRow key={`${threadId}-${i}`} line={line} onDesk={!onDark} onDark={onDark} />
            ))}
          </View>
        </View>
      ) : (
        shown.map((line, i) => <LogRow key={`${threadId}-${i}`} line={line} />)
      )}
      {/* the verdict is a CONCLUSION, so a hairline sets it off from the
          steps rather than letting it read as one more of them
          (2026-07-25). stepsOnly drops both: in-thread the console is a
          live readout under your ask ("한줄씩 나오는걸로만" — just the
          lines), and the agent's own reply below is the real verdict, so
          a "✓ Done" stamp there said it twice. */}
      {stepsOnly ? null : (
        <>
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
        </>
      )}
    </Pressable>
  );
}

export default ThinkingConsole;
