import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DevReset } from '@/components/dev/dev-reset';
import { colors, fontSize, fontWeight, spacing } from '@/theme/theme';

type Props = {
  title: string;
  /** @deprecated no longer rendered — header is a centered single-line title (Telegram-style) */
  subtitle?: string;
  children: ReactNode;
  /** content rendered to the right of the title (e.g. a status pill) */
  headerRight?: ReactNode;
  /** content rendered to the left of the title (e.g. a back button on pushed screens) */
  headerLeft?: ReactNode;
};

/** Standard screen frame: safe area + a centered single-line title (Telegram-style). */
export function Screen({ title, children, headerRight, headerLeft }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View
        style={{
          height: 44,
          paddingHorizontal: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSize.bodyLg,
            fontWeight: fontWeight.semibold,
          }}>
          {title}
        </Text>
        {headerLeft ? (
          <View style={{ position: 'absolute', left: spacing.lg }}>{headerLeft}</View>
        ) : null}
        {headerRight ? (
          <View style={{ position: 'absolute', right: spacing.lg }}>{headerRight}</View>
        ) : null}
      </View>
      {children}
      <DevReset />
    </SafeAreaView>
  );
}

export default Screen;
