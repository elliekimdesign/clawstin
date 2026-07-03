import { Pressable, Text, View } from 'react-native';

import { colors, fontFamily, fontSize, radius, spacing } from '@/theme/theme';

/** Tap-to-send example prompts shown under an agent message. */
export function SuggestionChips({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (text: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, maxWidth: 280 }}>
      {suggestions.map((text) => (
        <Pressable
          key={text}
          onPress={() => onPick(text)}
          style={({ pressed }) => ({
            backgroundColor: colors.accent,
            borderRadius: radius.pill,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            opacity: pressed ? 0.85 : 1,
          })}>
          <Text
            style={{
              color: colors.accentText,
              fontSize: fontSize.small,
              fontFamily: fontFamily.semibold,
            }}>
            {text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
