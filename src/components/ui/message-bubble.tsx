import { ReactNode, useState } from 'react';
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
      <View style={{ marginBottom: spacing.lg }}>
        {text ? (
          <Text
            style={{
              color: darkChat.text,
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
  // End position of the last text line, measured after layout — the crew
  // mark is pinned there, spilling into the reserved right rail when full.
  const [lastLine, setLastLine] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '92%', marginBottom: spacing.lg }}>
      {text ? (
        <>
          <Text
            style={BODY_STYLE}
            onTextLayout={(e) => {
              const lines = e.nativeEvent.lines;
              if (lines.length) {
                const l = lines[lines.length - 1];
                setLastLine({ x: l.x, y: l.y, width: l.width, height: l.height });
              }
            }}>
            {text}
          </Text>
          {lastLine ? (
            <View
              style={{
                position: 'absolute',
                left: lastLine.x + lastLine.width + 8,
                top: lastLine.y + (lastLine.height - 20) / 2,
                width: 20,
                height: 20,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.28)',
                borderWidth: 1,
                borderColor: darkChat.glassBorder,
              }}
            />
          ) : null}
        </>
      ) : null}
      {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
    </View>
  );
}

export default MessageBubble;
