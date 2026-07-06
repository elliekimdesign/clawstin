import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/app-store';
import { fontSize, fontWeight, spacing } from '@/theme/theme';

// blissxp ink tones (see the GLASS palette in the home tab).
const INK = '#1F3A57';
const INK_DIM = 'rgba(31,58,87,0.6)';
const TITLE = '#2C4A6B';

/** Bottom sheet with the COMPLETE prompt history (every agent, newest
 * first). Tapping a row drops back into the conversation that prompt
 * came from. Opened from the home tab's RECENT card. */
export function PromptHistorySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { activity } = useAppStore();
  const insets = useSafeAreaInsets();

  const openEntry = (threadId: string) => {
    onClose();
    router.push(`/chat/${threadId}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* invisible backdrop; tap anywhere above the sheet to close */}
      <Pressable onPress={onClose} style={{ flex: 1 }} />
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          maxHeight: '78%',
          paddingBottom: Math.max(insets.bottom, 12),
          shadowColor: '#2E3252',
          shadowOpacity: 0.25,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -8 },
          elevation: 16,
        }}>
        {/* grabber */}
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(31,58,87,0.15)',
            marginTop: 8,
          }}
        />
        {/* header */}
        <Text
          style={{
            color: TITLE,
            fontSize: 11,
            fontWeight: fontWeight.semibold,
            letterSpacing: 1,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
          }}>
          HISTORY
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {activity.map((entry, i) => (
            <Pressable
              key={entry.id}
              onPress={() => openEntry(entry.threadId)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: 14,
                paddingHorizontal: spacing.xl,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: 'rgba(31,58,87,0.08)',
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text
                style={{
                  flex: 1,
                  color: INK,
                  fontSize: fontSize.body,
                  // quiet list; only items needing attention (failed or
                  // waiting on approval) are bold
                  fontWeight: entry.status ? fontWeight.bold : fontWeight.regular,
                }}
                numberOfLines={1}>
                {entry.prompt}
              </Text>
              <Text style={{ color: INK_DIM, fontSize: fontSize.small }}>
                {entry.ago}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default PromptHistorySheet;
