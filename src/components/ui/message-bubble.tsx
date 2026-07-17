import { ReactNode, useState } from 'react';
import { NativeSyntheticEvent, Text, TextLayoutEventData, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { darkChat, fontFamily, spacing } from '@/theme/theme';
import { ThinkingBlob } from './thinking-blob';

type Props = {
  from: 'user' | 'agent';
  text?: string;
  /** agent spoke FIRST (escalation reminder) — gets the update caption */
  proactive?: boolean;
  /** caption override, e.g. "TASK PAUSED" on failure updates */
  caption?: string;
  /** the blob glued to the end of this reply's text (2026-07-16): only
   * the LAST agent message in the thread, and only while nothing new
   * is being thought about — it vanishes the instant a fresh send
   * starts and reappears once the new reply settles */
  showBlob?: boolean;
  /** optional content rendered below the text (e.g. an inline approval card) */
  children?: ReactNode;
};

// Warning amber shared with the home "needs you" grammar.
const NUDGE = '#F0812F';

const BODY_STYLE = {
  // v2 (2026-07-16, "near white" desk): the field flipped from bright
  // blue to near-white, so white text would vanish — back to the
  // app's own ink black, no backing wash either way
  color: '#16181C',
  fontSize: 16,
  lineHeight: 24,
  fontFamily: fontFamily.regular,
} as const;

/**
 * A chat message. Everything is borderless plain text on the dark slate-teal
 * gradient — consecutive log lines, not boxed replies. User messages read as
 * "commands": monospace with a "> " prompt prefix; agent replies are regular
 * text. Inline cards (approval/schedule/result) follow below the text and
 * carry their own surfaces.
 *
 * Agent replies end with a crew mark: a small circle (grey placeholder, later
 * the character image of the ONE crew member who led the work) glued to the
 * end of the last text line. The chat list reserves a right rail exactly for
 * this, so when the line is full the mark overflows into that rail instead of
 * re-wrapping the text. Other participating crews will be revealed on tap
 * later; no counts, no extra faces.
 */
export function MessageBubble({ from, text, proactive, caption, showBlob, children }: Props) {
  const isUser = from === 'user';

  if (isUser) {
    return (
      // my prompt starts a new beat: extra air above separates it from
      // the previous answer chunk's rail
      <View style={{ marginTop: spacing.md, marginBottom: spacing.lg, alignItems: 'flex-start' }}>
        {text ? (
          // v2 (2026-07-16, "> 이거 없애고 ask bar 스타일로"): the "> "
          // console prefix is retired — the sent message now wears the
          // ASK BAR's own light glass field material (translucent
          // white + hairline), not the dark command-line look.
          // v3 (same day, "글씨가 나올때는... 쳐지면서 나오게"): a real
          // settle-in micro-interaction — drops a few points and fades,
          // instead of hard-cutting into existence.
          <Animated.View
            entering={FadeIn.duration(220).springify().damping(14).withInitialValues({
              transform: [{ translateY: -8 }],
            })}
            style={{
              // v2 (2026-07-16, "near white" desk): a white-on-white
              // pill vanished once the field lightened — a soft blue
              // tint now carries the same "ask bar" glass language but
              // actually reads as a distinct sent bubble
              maxWidth: '86%',
              backgroundColor: 'rgba(143,191,242,0.28)',
              borderRadius: 0,
              borderWidth: 1,
              borderColor: 'rgba(94,159,224,0.4)',
              paddingHorizontal: 14,
              paddingVertical: 9,
            }}>
            <Text
              style={{
                color: '#16181C',
                fontSize: 15,
                lineHeight: 21,
                fontFamily: fontFamily.regular,
              }}>
              {text}
            </Text>
          </Animated.View>
        ) : null}
        {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
      </View>
    );
  }

  return (
    <AgentMessage text={text} proactive={proactive} caption={caption} showBlob={showBlob}>
      {children}
    </AgentMessage>
  );
}

/** The system spoke on its own (escalation, failure update): a tiny mono
 * caption sets this apart from replies the user asked for. */
function SystemCaption({ label }: { label: string }) {
  return (
    <Text
      style={{
        fontFamily: fontFamily.mono,
        fontSize: 10,
        letterSpacing: 1,
        color: NUDGE,
        marginBottom: 5,
      }}>
      {label}
    </Text>
  );
}

function AgentMessage({
  text,
  proactive,
  caption,
  showBlob,
  children,
}: {
  text?: string;
  proactive?: boolean;
  caption?: string;
  showBlob?: boolean;
  children?: ReactNode;
}) {
  const capText = caption ?? (proactive ? 'CREW UPDATE' : null);
  // the blob glues to the END OF THE ACTUAL LAST LINE (2026-07-16,
  // "문장 바로 긑에 오게") — RN can't inline a live Skia canvas inside
  // Text, so instead onTextLayout measures where the last wrapped line
  // actually ends and the blob is absolutely positioned right there,
  // rather than dropping to its own row under the whole paragraph.
  const [lastLineEnd, setLastLineEnd] = useState<{ x: number; y: number } | null>(null);
  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = e.nativeEvent.lines;
    const last = lines[lines.length - 1];
    if (last) setLastLineEnd({ x: last.x + last.width, y: last.y });
  };

  // RULE: no rails, no boxes — every answer (text or card) sits flush on
  // the same left edge as the user's prompt. Alignment does the grouping;
  // a data card's own border is all the framing it needs.
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '92%', marginBottom: spacing.lg }}>
      {capText ? <SystemCaption label={capText} /> : null}
      {text ? (
        <Animated.View
          entering={FadeIn.duration(240).springify().damping(14).withInitialValues({
            transform: [{ translateY: -6 }],
          })}
          // extra right padding reserves room for the blob so it never
          // gets clipped past the bubble's own maxWidth
          style={{ paddingRight: showBlob ? 30 : 0 }}>
          <Text style={BODY_STYLE} onTextLayout={onTextLayout}>
            {text}
          </Text>
          {showBlob && lastLineEnd ? (
            <Animated.View
              entering={FadeIn.duration(260)}
              exiting={FadeOut.duration(150)}
              style={{
                position: 'absolute',
                left: lastLineEnd.x + 6,
                top: lastLineEnd.y - 2,
              }}>
              <ThinkingBlob size={28} />
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : null}
      {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
    </View>
  );
}

export default MessageBubble;
