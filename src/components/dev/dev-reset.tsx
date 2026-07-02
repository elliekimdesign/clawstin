import { Pressable, Text } from 'react-native';

import { useAppStore } from '@/store/app-store';

/**
 * Dev-only floating "reset to start" button.
 *
 * Lets you jump back to the onboarding screen from anywhere while testing the
 * flow. Renders nothing in production builds (`__DEV__` is false there), so it
 * never ships to real users.
 */
export function DevReset() {
  const { setConnected } = useAppStore();

  if (!__DEV__) return null;

  return (
    <Pressable
      onPress={() => setConnected(false)}
      hitSlop={8}
      style={({ pressed }) => ({
        position: 'absolute',
        top: 60,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 999,
        paddingVertical: 5,
        paddingHorizontal: 10,
        opacity: pressed ? 0.9 : 0.5,
        zIndex: 9999,
      })}>
      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>↺ start</Text>
    </Pressable>
  );
}

export default DevReset;
