import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';

import { darkChat } from '@/theme/theme';

/**
 * Tool switch (2026-07-12): the chat header's tool circle unfolds
 * LEFTWARD into the tool row — connected tools bright and pickable,
 * the rest asleep in gray. Picking one pins the conversation's tool
 * context ("pr 내일꺼 체크" without saying GitHub). Same grammar as
 * the crew pill: the system guesses, one tap pins.
 */

const PILL_NAVY = 'rgba(46,80,121,0.5)';
const AZURE = '#4285F4';

export type ToolDef = { key: string; icon: keyof typeof Ionicons.glyphMap; connected: boolean };

/** display order: connected first, then the not-yet-integrated shadows */
export const TOOL_DEFS: ToolDef[] = [
  { key: 'calendar', icon: 'calendar-clear-outline', connected: true },
  { key: 'contacts', icon: 'people-outline', connected: true },
  { key: 'github', icon: 'logo-github', connected: true },
  { key: 'gmail', icon: 'mail-outline', connected: false },
  { key: 'google-home', icon: 'home-outline', connected: false },
  { key: 'files', icon: 'folder-outline', connected: false },
  { key: 'health', icon: 'fitness-outline', connected: false },
];

export function ToolSwitch({
  tool,
  onPick,
  onCalendarTap,
  calOpen,
  directCalendar = false,
  onExpandChange,
}: {
  /** the active tool key (pinned override or the thread's own) */
  tool: string;
  onPick: (key: string) => void;
  /** tapping the already-active calendar keeps its month-view door */
  onCalendarTap: () => void;
  calOpen: boolean;
  /** a calendar moment is live on screen (week strip): the circle tap
   * goes straight to the calendar action instead of the tool row */
  directCalendar?: boolean;
  /** fires on expand/collapse so the header can clear the center pill */
  onExpandChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  useEffect(() => clearClose, []);
  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), 2500);
  };
  const flip = (v: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    setOpen(v);
    onExpandChange?.(v);
    if (v) scheduleClose();
  };

  const active = TOOL_DEFS.find((t) => t.key === tool) ?? TOOL_DEFS[0];

  if (!open) {
    return (
      <Pressable
        // while the month view is up this button IS its close (✕);
        // otherwise it unfolds the tool row
        onPress={() =>
          calOpen || (directCalendar && tool === 'calendar') ? onCalendarTap() : flip(true)
        }
        hitSlop={8}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: calOpen ? AZURE : PILL_NAVY,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}>
        <Ionicons
          name={calOpen ? 'close' : active.icon}
          size={19}
          color={calOpen ? '#FFFFFF' : darkChat.text}
        />
      </Pressable>
    );
  }

  return (
    <>
      {/* outside tap folds the row back */}
      <Pressable
        onPress={() => flip(false)}
        style={{ position: 'absolute', top: -1000, right: -1000, width: 3000, height: 3000 }}
      />
      <View
        style={{
          height: 40,
          borderRadius: 999,
          backgroundColor: PILL_NAVY,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          gap: 2,
        }}>
        {TOOL_DEFS.map((t) => (
          <Pressable
            key={t.key}
            disabled={!t.connected}
            onPress={() => {
              if (t.key === 'calendar' && t.key === tool) {
                flip(false);
                onCalendarTap();
                return;
              }
              onPick(t.key);
              flip(false);
            }}
            hitSlop={4}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              // the active tool sits in a quiet white step
              backgroundColor: t.key === tool ? 'rgba(255,255,255,0.18)' : 'transparent',
              opacity: pressed ? 0.6 : 1,
            })}>
            <Ionicons
              name={t.icon}
              size={17}
              // asleep tools are shadows: visible as POSSIBLE, not active
              color={t.connected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.28)'}
            />
          </Pressable>
        ))}
      </View>
    </>
  );
}

export default ToolSwitch;
