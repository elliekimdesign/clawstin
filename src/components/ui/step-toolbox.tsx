import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { fontFamily } from '@/theme/theme';

/**
 * DESIGN TOOLBOX (2026-07-30): jump straight to any first-run step while
 * building, instead of reinstalling the app to see the splash again.
 *
 * Deliberately a dev affordance, not product UI — it wears the console's
 * dark face so it can never be mistaken for part of the board, and it
 * collapses to a single small key. Delete this component and its one call
 * site to ship.
 */

export type ToolboxStep = {
  key: string;
  label: string;
  onPress: () => void;
  /** the step currently on screen */
  active?: boolean;
};

export function StepToolbox({ steps }: { steps: ToolboxStep[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 14,
          bottom: 108,
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: 'rgba(14,22,38,0.82)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
          zIndex: 90,
        })}>
        <Ionicons name="construct-outline" size={16} color="rgba(255,255,255,0.85)" />
      </Pressable>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        right: 14,
        bottom: 108,
        borderRadius: 12,
        backgroundColor: 'rgba(14,22,38,0.94)',
        paddingVertical: 6,
        minWidth: 168,
        zIndex: 90,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}>
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 10,
            letterSpacing: 0.4,
            color: 'rgba(255,255,255,0.45)',
          }}>
          STEPS
        </Text>
        <Pressable onPress={() => setOpen(false)} hitSlop={10}>
          <Ionicons name="close" size={13} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>

      {steps.map((s) => (
        <Pressable
          key={s.key}
          onPress={s.onPress}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 9,
            backgroundColor: s.active ? 'rgba(255,255,255,0.10)' : 'transparent',
            opacity: pressed ? 0.6 : 1,
          })}>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 12,
              color: s.active ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            }}>
            {s.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default StepToolbox;
