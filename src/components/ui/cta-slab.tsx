import { StyleSheet, View } from 'react-native';

/**
 * The CTA slab material, v3 (2026-07-14 night): one flat, quiet tone —
 * the slightly-deepened blue-gray of the section windows' title strips
 * — no glass, no shader, no motion ("모션 지우고 그냥 배경으로...
 * 약간 짙은 버튼 배경"). v1's gradient washes and v2's Liquid Glass +
 * pulsing neon ring both live in git history; pulsing-border.tsx stays
 * in the tree for future surfaces. Drop inside any overflow-hidden
 * Pressable; the host keeps its own shape, size, padding, ink label.
 */
export function CtaSlabFill({
  animated: _animated = true,
  shape: _shape = 'round',
  tone = 'strip',
}: {
  /** kept for call-site compatibility; the static fill ignores both */
  animated?: boolean;
  shape?: 'round' | 'square';
  /** 'strip' = the title-strip blue-gray (board buttons); 'white' =
   * plain white (the start screen's Get started on the pale field) */
  tone?: 'strip' | 'white';
}) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: tone === 'white' ? '#FFFFFF' : '#9FB6CD' },
      ]}
      pointerEvents="none"
    />
  );
}

/** The slab's matching label color (ink — the body is glass now). */
export const CTA_SLAB_INK = '#16181C';

export default CtaSlabFill;
