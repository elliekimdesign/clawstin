import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { colors, fontFamily, spacing } from '@/theme/theme';

type Props = {
  from: 'user' | 'agent';
  text?: string;
  /** optional content rendered below the text (e.g. an inline approval card) */
  children?: ReactNode;
};

/**
 * A chat message. Agent messages are borderless plain text on the pearl
 * gradient (modern AI-app style); user messages are a charcoal pill.
 */
export function MessageBubble({ from, text, children }: Props) {
  const isUser = from === 'user';

  if (isUser) {
    return (
      <View style={{ alignSelf: 'flex-end', maxWidth: '84%', marginBottom: spacing.lg }}>
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: 22,
            borderBottomRightRadius: 8,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
          }}>
          {text ? (
            <Text
              style={{
                color: colors.accentText,
                fontSize: 15.5,
                lineHeight: 22,
                fontFamily: fontFamily.regular,
              }}>
              {text}
            </Text>
          ) : null}
          {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '92%', marginBottom: spacing.lg }}>
      {text ? (
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            lineHeight: 24,
            fontFamily: fontFamily.regular,
          }}>
          {text}
        </Text>
      ) : null}
      {children ? <View style={{ marginTop: text ? spacing.md : 0 }}>{children}</View> : null}
    </View>
  );
}

export default MessageBubble;
