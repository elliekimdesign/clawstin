import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { FrostedGlassFill } from './frosted-glass-fill';

/**
 * Tool switch (2026-07-12; row unfold retired 2026-07-16): the chat
 * header's tool circle — a single door showing whichever tool the
 * conversation is using. Wears the compose family's grained glass
 * (2026-07-17); the dark readout face retired with the navy era.
 */

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
  onCalendarTap,
  calOpen,
}: {
  /** the active tool key (pinned override or the thread's own) */
  tool: string;
  /** tapping the already-active calendar keeps its month-view door */
  onCalendarTap: () => void;
  calOpen: boolean;
}) {
  // the unfold-into-a-row behavior is RETIRED (2026-07-16, "이 디자인은
  // 다 지우면 돼... 첫화면에서는 동그라미 부분이 툴 아이콘이야") — this
  // is now ALWAYS the single collapsed circle, always showing the
  // active tool's own icon. Picking a different tool happens through
  // the vertical corner stack elsewhere in the header, not here.
  const active = TOOL_DEFS.find((t) => t.key === tool) ?? TOOL_DEFS[0];

  return (
    <Pressable
      onPress={onCalendarTap}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 999,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
        shadowColor: '#16181C',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      })}>
      {/* the compose family's grained glass (2026-07-17 "버튼 툴부분
          여전히 옛날 스타일" — the navy display face retired); the
          open month view brightens the face instead of a lit rim */}
      <FrostedGlassFill
        flat
        radius={20}
        tint={calOpen ? 'rgba(255,255,255,0.95)' : 'rgba(242,245,248,0.82)'}
      />
      {/* always the TOOL icon, never a ✕ (2026-07-16, "항상 툴모양
          아이콘으로") — this circle IS the tool; the month view's own
          close lives with the month view, not stolen from here */}
      <Ionicons name={active.icon} size={19} color="rgba(22,24,28,0.7)" />
    </Pressable>
  );
}

export default ToolSwitch;
