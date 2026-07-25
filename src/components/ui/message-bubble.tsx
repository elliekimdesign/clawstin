import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { fontFamily, spacing } from '@/theme/theme';
import { ClawstinMark } from './clawstin-mark';
import { CrewPixel } from './crew-pixel';
import { FrostedGlassFill } from './frosted-glass-fill';

type Props = {
  from: 'user' | 'agent';
  text?: string;
  /** agent spoke FIRST (escalation reminder) — gets the update caption */
  proactive?: boolean;
  /** caption override, e.g. "TASK PAUSED" on failure updates */
  caption?: string;
  /** the crew member whose FACE leads the reply (2026-07-22 "문장의
   * 시작은 모두 페이스로"): assigned work answers with its member's
   * face; ownerless replies front the Clawstin mark instead */
  agentId?: string;
  /** optional content rendered below the text (e.g. an inline approval card) */
  children?: ReactNode;
};

// Warning amber shared with the home "needs you" grammar.
const NUDGE = '#F0812F';

/** THE TEXT COLUMN (2026-07-24 "전광판에 나오는 거랑 똑같은 데서 시작"):
 * every sentence starts this far in from the scroll's edge padding. Set by
 * the agent row's own face chip (22) + gap (8) — the caption and the child
 * cards indent to match it, since they have no face to push them. */
const TEXT_COL = 34;

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
export function MessageBubble({ from, text, proactive, caption, agentId, children }: Props) {
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
        // on the shared text column, like everything else (2026-07-24)
        marginLeft: TEXT_COL,
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
  agentId,
  children,
}: {
  text?: string;
  proactive?: boolean;
  caption?: string;
  agentId?: string;
  children?: ReactNode;
}) {
  const capText = caption ?? (proactive ? 'CREW UPDATE' : null);
  // The onTextLayout line-measuring that pinned the blob to the end of the
  // last wrapped line (2026-07-16 "문장 바로 긑에 오게") retired 2026-07-24 —
  // the blob has its own row now, so nothing needs measuring.

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
          // ONE TEXT COLUMN (2026-07-24 "전광판에 나오는 거랑 똑같은 데서
          // 시작"): this row DEFINES the column — face chip (22) + gap (8)
          // puts its text 30px in, and the mast/index/cards were moved to
          // match. Pulling this row left instead would have shoved the face
          // flush against the screen edge.
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          {/* the face rides a white profile chip (2026-07-22 "챗
              프로필처럼": bare pixels on the field read colorless and
              harsh) and tops out level with the first text line */}
          <View
            style={{
              marginTop: 1,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {/* a touch bigger inside the SAME chip (2026-07-24 "얼굴 조금만
                더 크게 아주조금만"): the chip stays 22 so the 30px text
                column (chip + gap) doesn't move — only the face fills more
                of it, 15 → 17 */}
            {agentId ? (
              <CrewPixel id={agentId} size={20} />
            ) : (
              <ClawstinMark size={20} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={BODY_STYLE}>{text}</Text>
          </View>
        </Animated.View>
      ) : null}
      {/* cards keep the same left edge as the sentence above them — the reply
          and its evidence read as one block (2026-07-24). They still run to
          the full right margin. */}
      {children ? (
        <View style={{ marginTop: text ? spacing.md : 0, paddingLeft: TEXT_COL }}>
          {children}
        </View>
      ) : null}
      {/* The at-rest blob MOVED to the prompt mast (2026-07-24 "맨 밑에
          나오는거 지우고... 여기 옆에 넣어줘"): trailing the thread it was a
          stray dot hanging under the last answer. Beside the pinned ask it
          reads as what it actually means — this run is alive/at rest. */}
    </View>
  );
}

export default MessageBubble;
