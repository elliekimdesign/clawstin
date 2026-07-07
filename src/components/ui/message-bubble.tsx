import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { darkChat, fontFamily, spacing } from '@/theme/theme';

type Props = {
  from: 'user' | 'agent';
  text?: string;
  /** optional content rendered below the text (e.g. an inline approval card) */
  children?: ReactNode;
};

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
export function MessageBubble({ from, text, children }: Props) {
  const isUser = from === 'user';

  if (isUser) {
    return (
      // my prompt starts a new beat: extra air above separates it from
      // the previous answer chunk's rail
      <View style={{ marginTop: spacing.md, marginBottom: spacing.lg }}>
        {text ? (
          <Text
            style={{
              // MY input reads apart from the agent's white: classic
              // terminal-prompt green (the colorway's success tone)
              color: darkChat.success,
              fontSize: 14,
              lineHeight: 20,
              fontFamily: fontFamily.mono,
            }}>
            {'> '}
            {text}
          </Text>
        ) : null}
        {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
      </View>
    );
  }

  return <AgentMessage text={text}>{children}</AgentMessage>;
}

function AgentMessage({ text, children }: { text?: string; children?: ReactNode }) {
  return (
    // The left rail: one thin line spanning the WHOLE answer chunk (text,
    // cards, chips) so its extent reads at a glance.
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'flex-start',
        maxWidth: '92%',
        marginBottom: spacing.lg,
      }}>
      {/* the thread: a node marks where the answer starts, a hairline
          carries it down, and a node closes the chunk */}
      <View
        style={{
          width: 6,
          marginRight: 9,
          alignSelf: 'stretch',
          alignItems: 'center',
          paddingTop: 9,
          paddingBottom: 3,
        }}>
        <View
          style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' }}
        />
        <View style={{ flex: 1, width: 1.2, backgroundColor: 'rgba(255,255,255,0.18)' }} />
        <View
          style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' }}
        />
      </View>
      <View style={{ flex: 1 }}>
        {text ? <Text style={BODY_STYLE}>{text}</Text> : null}
        {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
      </View>
    </View>
  );
}

export default MessageBubble;
