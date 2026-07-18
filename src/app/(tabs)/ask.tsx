import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable } from 'react-native';

/**
 * The tab bar's detached "+" circle (2026-07-17). Native triggers are
 * routes, so this screen exists only to BOUNCE: the moment it gains
 * focus it hands the tab selection back to Home and floats the chat
 * compose on top. The push rides the NEXT frame — firing both
 * navigations in one commit sometimes lost the race and left this
 * placeholder visible (the 16:57 blank-screen bug). If the bounce
 * still ever strands here, tapping anywhere retries it.
 */
export default function AskTab() {
  const bounce = useCallback(() => {
    router.replace('/(tabs)');
    requestAnimationFrame(() => {
      router.push({ pathname: '/chat/[id]', params: { id: 'new' } });
    });
  }, []);
  useFocusEffect(bounce);
  // matches the desk blue so the single-frame handoff stays invisible
  return <Pressable onPress={bounce} style={{ flex: 1, backgroundColor: '#4E83B8' }} />;
}
