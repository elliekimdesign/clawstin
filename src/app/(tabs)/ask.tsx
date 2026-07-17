import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

/**
 * The tab bar's detached "+" circle (2026-07-17). Native triggers are
 * routes, so this screen exists only to BOUNCE: the moment it gains
 * focus it hands the tab selection back to Home and pushes the chat
 * compose full-screen on top — closing the compose lands on Home, and
 * this screen is never actually seen.
 */
export default function AskTab() {
  useFocusEffect(
    useCallback(() => {
      router.replace('/(tabs)');
      router.push({ pathname: '/chat/[id]', params: { id: 'new' } });
    }, [])
  );
  // matches the desk blue so any single-frame flash stays invisible
  return <View style={{ flex: 1, backgroundColor: '#4E83B8' }} />;
}
