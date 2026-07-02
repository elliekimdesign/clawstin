import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

type Props = {
  from: 'user' | 'agent';
  text?: string;
  /** optional content rendered below the text (e.g. an inline approval card) */
  children?: ReactNode;
};

/** A chat bubble. User bubbles are accent-colored & right-aligned. */
export function MessageBubble({ from, text, children }: Props) {
  const isUser = from === 'user';
  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '84%',
        marginBottom: spacing.md,
      }}>
      <View
        style={{
          backgroundColor: isUser ? colors.bubbleUser : colors.bubbleAgent,
          borderRadius: radius.lg,
          borderBottomRightRadius: isUser ? 6 : radius.lg,
          borderBottomLeftRadius: isUser ? radius.lg : 6,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
        }}>
        {text ? (
          <Text
            style={{
              color: isUser ? colors.bubbleUserText : colors.bubbleAgentText,
              fontSize: fontSize.body,
              lineHeight: 21,
            }}>
            {text}
          </Text>
        ) : null}
        {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
      </View>
    </View>
  );
}

export default MessageBubble;
