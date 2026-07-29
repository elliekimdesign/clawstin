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
// 34 -> 16 -> 4 (2026-07-25 "너무 띄어서 글씨가 시작해 왼쪽에서"): 34 cleared
// the old leading face chip. The ScrollView ALREADY pads spacing.lg (14) down
// each side, so a further 16 here stacked into ~30px of dead margin before the
// first letter. This is now just a hair of optical inset on top of the
// scroll's own padding. Must stay equal to TEXT_COL in app/chat/[id].tsx.
const TEXT_COL = 4;

const BODY_STYLE = {
  // v3 (2026-07-17, mosaic blue desk + "컨텐츠는 흰색으로"): the field
  // is the desk blue again, so agent replies speak in white — the same
  // way Home's own text sits on the desk
  // INK, not white (2026-07-25): the mosaic field went pale, so a white
  // voice measured 1.29:1. Mirrors darkChat.text.
  color: '#16181C',
  // 16 -> 17.5 (2026-07-25 "본문 바디 글씨를 조금더 크게") -> 16 again
  // (2026-07-29 "홈탭에 맞게 일관성있는"): 17.5 read oversized beside Home's
  // 15pt body. 16 keeps chat a hair above the board's dense rows — it is
  // still the reading surface — without looking like a different app.
  fontSize: 16,
  lineHeight: 23,
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
          // THE FACE LEADS AGAIN, but SMALL (2026-07-25 "이모지를 글씨 앞에
          // 넣기"): it briefly signed the END of the reply, which read as a
          // stray dot floating after the last line. Back at the front it says
          // who is speaking before you read what they said — the original
          // 2026-07-22 instinct — except at 18px instead of the old 26px
          // chip, so the text column only steps in a little.
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7 }}>
          {/* the face rides a white profile chip ("챗 프로필처럼", 2026-07-22:
              bare pixels on the blue field read colorless and harsh) and tops
              out level with the first text line */}
          <View
            style={{
              marginTop: 3,
              // 18 -> 23 chip (2026-07-25 "이 페이스 사이즈는 앞에 홈탭에
              // 나오는 애사이즈만큼 하거나 약간 더 크게해도돼"): Home's board
              // rows draw their crew faces at FACE = 21, and this reply chip
              // was sitting under that. A hair larger than Home is fine here —
              // the chat has one face per reply, not a dense column of them.
              width: 23,
              height: 23,
              borderRadius: 11.5,
              backgroundColor: 'rgba(255,255,255,0.92)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {agentId ? <CrewPixel id={agentId} size={19} /> : <ClawstinMark size={19} />}
          </View>
          <Text style={[BODY_STYLE, { flex: 1 }]}>{text}</Text>
        </Animated.View>
      ) : null}
      {/* cards align to the reply's TEXT, not its face (2026-07-25 "글씨 밑으로
          대답 시작부분에 맞춰서 더 정렬해서 크기를 줄여서... 페이스부분까지
          나오는게 아니야"): they used to start at TEXT_COL, i.e. the face
          column, so every card hung one step further left than the sentence it
          belonged to and read as a sibling of the reply rather than its
          evidence. +30 clears the face chip (23) and its gap (7), putting the
          card's left edge exactly under the first letter above it. The right
          edge pulls in too, so the card is visibly NARROWER than the text
          block — subordinate to it. */}
      {children ? (
        <View
          style={{
            marginTop: text ? spacing.md : 0,
            // 30, NOT TEXT_COL + 30 (2026-07-25 "여기 버튼길이가 글씨
            // 시작부분보다 짧네"): the reply row above pays TEXT_COL once
            // already, so adding it again here pushed the card 4px right of the
            // sentence. 30 = the face chip (23) + its gap (7), which is exactly
            // the offset from the row's edge to the first letter.
            paddingLeft: 30,
            // TEXT_COL, not +8 (2026-07-25 "이 네모 끝이 프롬프트 오른쪽 선
            // 끝이랑 안맞아. 약간더 길어도디"): the extra 8 left the card's
            // right edge 8px short of the ask pane's, so the two surfaces did
            // not share a right margin. They line up exactly now.
            paddingRight: TEXT_COL,
          }}>
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
