import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { darkChat, fontFamily, spacing } from '@/theme/theme';

type Props = {
  from: 'user' | 'agent';
  text?: string;
  /** agent spoke FIRST (escalation reminder) — gets the update caption */
  proactive?: boolean;
  /** caption override, e.g. "TASK PAUSED" on failure updates */
  caption?: string;
  /** optional content rendered below the text (e.g. an inline approval card) */
  children?: ReactNode;
};

// Warning amber shared with the home "needs you" grammar.
const NUDGE = '#F0812F';

const BODY_STYLE = {
  color: darkChat.text,
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
export function MessageBubble({ from, text, proactive, caption, children }: Props) {
  const isUser = from === 'user';

  if (isUser) {
    return (
      // my prompt starts a new beat: extra air above separates it from
      // the previous answer chunk's rail
      <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
        {text ? (
          // highlighter, not a card: the background hugs ONLY the
          // glyphs. INK, the console's own dark — nothing else on the
          // blue desk is this dark, so my command cuts through, and it
          // rhymes with the terminal console above (command = console)
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 14,
                lineHeight: 22,
                fontFamily: fontFamily.mono,
                marginRight: 8,
              }}>
              {'>'}
            </Text>
            {/* a soft chip, not a hard block: the console navy at half
                strength with round corners melts into the desk while
                still reading as MY line */}
            <View
              style={{
                flexShrink: 1,
                backgroundColor: 'rgba(13,27,54,0.45)',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  lineHeight: 20,
                  fontFamily: fontFamily.mono,
                }}>
                {text}
              </Text>
            </View>
          </View>
        ) : null}
        {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
      </View>
    );
  }

  return (
    <AgentMessage text={text} proactive={proactive} caption={caption}>
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
  children,
}: {
  text?: string;
  proactive?: boolean;
  caption?: string;
  children?: ReactNode;
}) {
  const capText = caption ?? (proactive ? 'CREW UPDATE' : null);
  // RULE: no rails, no boxes — every answer (text or card) sits flush on
  // the same left edge as the user's prompt. Alignment does the grouping;
  // a data card's own border is all the framing it needs.
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '92%', marginBottom: spacing.lg }}>
      {capText ? <SystemCaption label={capText} /> : null}
      {text ? <Text style={BODY_STYLE}>{text}</Text> : null}
      {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
    </View>
  );
}

export default MessageBubble;
