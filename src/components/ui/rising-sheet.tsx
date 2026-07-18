import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

/**
 * The rising-folder MOTION shell (2026-07-17 "빠르게 올라와서 살포시"):
 * Modal's stock slide runs one flat tempo, so the shell animates the
 * rise itself — a stiff spring covers the distance fast, then the
 * damping bleeds the speed off for a soft landing. The modal stays
 * mounted a beat after close so the slide-down exit can play.
 */
export function RisingSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 240);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* dim scrim, faded independently of the folder's motion */}
      {visible ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(200)}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(22,24,28,0.2)' }]}
        />
      ) : null}
      <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        {/* tap anywhere above the folder to close */}
        <Pressable onPress={onClose} style={{ flex: 1 }} />
        {visible ? (
          <Animated.View
            // the Apple sheet curve itself (2026-07-17 "애플시스템처럼
            // 엘레강스"): cubic-bezier(0.32, 0.72, 0, 1) at ~540ms —
            // the exact curve iOS sheet presentations approximate.
            // Unhurried start, long silky deceleration, zero bounce.
            entering={SlideInDown.duration(540).easing(
              Easing.bezier(0.32, 0.72, 0, 1).factory()
            )}
            exiting={SlideOutDown.duration(260).easing(Easing.in(Easing.cubic))}>
            {children}
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

export default RisingSheet;
