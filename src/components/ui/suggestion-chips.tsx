import { Pressable, Text, View } from 'react-native';

import { darkChat, fontFamily, fontSize, radius, spacing } from '@/theme/theme';

/** Tap-to-send example prompts shown under an agent message — glass chips
 * (same surface family as the schedule card) so they read as tappable,
 * still carrying the command-line mono voice. Stacked one per line. */
export function SuggestionChips({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  return (
    <View style={{ gap: spacing.sm, alignItems: 'flex-start' }}>
      {suggestions.map((text) => (
        <Pressable
          key={text}
          onPress={() => onPick(text)}
          hitSlop={4}
          style={({ pressed }) => ({
            backgroundColor: darkChat.surface,
            borderWidth: 1,
            borderColor: darkChat.glassBorder,
            borderRadius: radius.lg,
            paddingVertical: 9,
            paddingHorizontal: spacing.lg,
            opacity: pressed ? 0.6 : 1,
          })}>
          <Text
            style={{
              color: darkChat.text,
              fontSize: fontSize.small,
              fontFamily: fontFamily.mono,
            }}>
            {text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
