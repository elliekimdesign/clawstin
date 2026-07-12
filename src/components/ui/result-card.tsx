import { Linking, Pressable, Text, View } from 'react-native';

import type { ResultCard as ResultCardData } from '@/mock/chat';
import { darkChat, fontFamily, fontSize, radius, spacing } from '@/theme/theme';

const MONO = fontFamily.mono;

/**
 * Universal result card — the one shape for every informational answer
 * (places, weather, prices…): a minimal text list + one deep-link text
 * button. We provide the canvas; the native app (Maps, Yelp…) does the
 * heavy UI.
 */
export function ResultCard({ result }: { result: ResultCardData }) {
  return (
    <View
      style={{
        minWidth: 232,
        backgroundColor: darkChat.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: darkChat.glassBorder,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
      }}>
      {result.items.map((item, i) => (
        <View
          key={item.label}
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: spacing.md,
            paddingVertical: spacing.md,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: darkChat.divider,
          }}>
          <Text
            numberOfLines={1}
            style={{
              flexShrink: 1,
              fontSize: fontSize.body,
              fontFamily: fontFamily.medium,
              color: darkChat.text,
            }}>
            {item.label}
          </Text>
          {item.detail ? (
            <Text
              style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: 0.4,
                color: darkChat.textSecondary,
              }}>
              {item.detail}
            </Text>
          ) : null}
        </View>
      ))}

      {result.action ? (
        <Pressable
          onPress={() => {
            const { url, webUrl } = result.action!;
            // app scheme first; fall back to the web if the app isn't installed
            Linking.openURL(url).catch(() => (webUrl ? Linking.openURL(webUrl) : undefined));
          }}
          hitSlop={8}
          style={({ pressed }) => ({
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: darkChat.divider,
            opacity: pressed ? 0.5 : 1,
          })}>
          <Text
            style={{
              fontSize: fontSize.small,
              fontFamily: fontFamily.semibold,
              color: darkChat.text,
            }}>
            {result.action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
