import { Pressable, Text, View } from 'react-native';

import { darkChat, fontFamily, fontSize, spacing } from '@/theme/theme';

/** Tap-to-send example prompts shown under an agent message — rendered as
 * bracketed command-line entries (not buttons), stacked one per line. */
export function SuggestionChips({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {suggestions.map((text) => (
        <Pressable key={text} onPress={() => onPick(text)} hitSlop={4}>
          {({ pressed }) => (
            <Text
              style={{
                color: darkChat.text,
                fontSize: fontSize.small,
                fontFamily: fontFamily.mono,
                opacity: pressed ? 0.5 : 1,
              }}>
              [ {text} ]
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
