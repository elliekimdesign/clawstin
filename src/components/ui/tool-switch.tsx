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

// READOUT register (2026-07-16): tools are INSTRUMENTS — they change
// with the prompt, so they wear the system-display face (dark +
// faintly lit rim, the crew readout's exact material), never the
// fixed-hardware keycap. Active tool = lit indicator.
const DISPLAY_FACE = 'rgba(20,36,56,0.88)';
const DISPLAY_RIM = 'rgba(143,191,242,0.22)';
const DISPLAY_RIM_LIT = 'rgba(143,191,242,0.85)';

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
    // MUST go through flip(): closing with bare setOpen left the header
    // stuck on toolExpanded=true — the crew pill never came back
    closeTimer.current = setTimeout(() => flip(false), 2500);
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
          borderRadius: 0,
          backgroundColor: DISPLAY_FACE,
          borderWidth: 1,
          borderColor: calOpen ? DISPLAY_RIM_LIT : DISPLAY_RIM,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        })}>
        <Ionicons
          name={calOpen ? 'close' : active.icon}
          size={19}
          color={calOpen ? '#EAF4FF' : darkChat.text}
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
          // unfolded, the row owns the header line ("한 라인을 다
          // 차지해도 돼") — the display strip, wider targets
          height: 48,
          borderRadius: 0,
          backgroundColor: DISPLAY_FACE,
          borderWidth: 1,
          borderColor: DISPLAY_RIM,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 7,
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
              width: 38,
              height: 38,
              borderRadius: 0,
              alignItems: 'center',
              justifyContent: 'center',
              // the active tool is the LIT indicator on the strip
              backgroundColor: t.key === tool ? 'rgba(143,191,242,0.22)' : 'transparent',
              opacity: pressed ? 0.6 : 1,
            })}>
            <Ionicons
              name={t.icon}
              size={22}
              // asleep tools are shadows: visible as POSSIBLE, not active
              color={t.connected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.32)'}
            />
          </Pressable>
        ))}
      </View>
    </>
  );
}

export default ToolSwitch;
