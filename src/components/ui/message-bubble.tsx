import { ReactNode, useState } from 'react';
import { NativeSyntheticEvent, Text, TextLayoutEventData, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { fontFamily, spacing } from '@/theme/theme';
import { ClawstinMark } from './clawstin-mark';
import { CrewPixel } from './crew-pixel';
import { FrostedGlassFill } from './frosted-glass-fill';
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
  /** the crew member whose FACE leads the reply (2026-07-22 "문장의
   * 시작은 모두 페이스로"): assigned work answers with its member's
   * face; ownerless replies front the Clawstin mark instead */
  agentId?: string;
  /** optional content rendered below the text (e.g. an inline approval card) */
  children?: ReactNode;
};

// Warning amber shared with the home "needs you" grammar.
const NUDGE = '#F0812F';

const BODY_STYLE = {
  // v3 (2026-07-17, mosaic blue desk + "컨텐츠는 흰색으로"): the field
  // is the desk blue again, so agent replies speak in white — the same
  // way Home's own text sits on the desk
  color: 'rgba(255,255,255,0.96)',
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
export function MessageBubble({ from, text, proactive, caption, showBlob, agentId, children }: Props) {
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
              // v3 (2026-07-17, mosaic desk): the sent prompt wears the
              // COMPOSER's own frosted glass at the board's 14 radius —
              // what you typed stays in the material you typed it in
              // one radius family in chat (2026-07-22 "radius가
              // 비슷하게": the board sections' 16, everywhere)
              maxWidth: '86%',
              borderRadius: 16,
              overflow: 'hidden',
              paddingHorizontal: 14,
              paddingVertical: 9,
            }}>
            <FrostedGlassFill flat radius={16} tint="rgba(255,255,255,0.8)" />
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
    <AgentMessage
      text={text}
      proactive={proactive}
      caption={caption}
      showBlob={showBlob}
      agentId={agentId}>
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
  agentId,
  children,
}: {
  text?: string;
  proactive?: boolean;
  caption?: string;
  showBlob?: boolean;
  agentId?: string;
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
  // FULL WIDTH (2026-07-22 "모든 공간 다 쓰기"): replies stretch to the
  // screen's own edge padding — the round tool dropdown is the one
  // layout that keeps its own width, and it lives elsewhere.
  return (
    <View style={{ alignSelf: 'stretch', marginBottom: spacing.lg }}>
      {capText ? <SystemCaption label={capText} /> : null}
      {text ? (
        // the sentence STARTS with a face (2026-07-22): assigned work
        // answers as its crew member; ownerless replies answer as
        // Clawstin herself — who is speaking reads before what.
        // The whole reply RISES in from below (2026-07-22 sequence:
        // "부드럽게 띄어올리듯이") once the console finishes.
        <Animated.View
          entering={FadeIn.duration(320).springify().damping(16).withInitialValues({
            transform: [{ translateY: 16 }],
          })}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          {/* the face rides a white profile chip (2026-07-22 "챗
              프로필처럼": bare pixels on the field read colorless and
              harsh) and tops out level with the first text line */}
          <View
            style={{
              marginTop: 1,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {agentId ? (
              <CrewPixel id={agentId} size={15} />
            ) : (
              <ClawstinMark size={15} />
            )}
          </View>
          <View
            // extra right padding reserves room for the blob so it never
            // gets clipped past the bubble's own width
            style={{ flex: 1, paddingRight: showBlob ? 30 : 0 }}>
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
                <ThinkingBlob size={36} />
              </Animated.View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
      {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
    </View>
  );
}

export default MessageBubble;
