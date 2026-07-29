import { Pressable, Text } from 'react-native';

import { fontFamily, fontSize } from '@/theme/theme';

/**
 * A chat as a FILE TAB (2026-07-29 "알약 스타일은 쓰지 말고 뭔가 좀 참신한
 * 거"): the board is built from folders whose label flap cuts away on a
 * diagonal, so a recent chat is one small tab of that same folder. Not a
 * pill, not a chip, not bare text on a hairline.
 *
 * Each tab closes as its own square with clear air around it. An earlier
 * pass had them overlapping on a diagonal, but the slants met in a messy
 * seam where two tabs touched (2026-07-29) — separation reads cleaner than
 * interlocking, and the hard square corners keep it out of pill territory
 * entirely.
 */

const HEIGHT = 30;
/** clear air between tabs (2026-07-29 "아예 거리를 띠고 딱 네모로"): the
 * overlapping diagonals met in a messy seam, so each tab now closes as its
 * own square and the gap does the separating. */
export const TAB_GAP = 10;

export function IndexTab({
  label,
  onPress,
  index = 0,
}: {
  label: string;
  onPress: () => void;
  index?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: HEIGHT,
        marginLeft: index === 0 ? 0 : TAB_GAP,
        // TRUE SQUARE (2026-07-29 "마감 라운드 넣지말고 사각으로"): no
        // radius at all, so the tab closes on a hard corner
        borderRadius: 0,
        justifyContent: 'center',
        paddingHorizontal: 12,
        maxWidth: 176,
        backgroundColor: 'rgba(255,255,255,0.55)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        opacity: pressed ? 0.6 : 1,
      })}>
      <Text
        numberOfLines={1}
        style={{
          fontSize: fontSize.small,
          fontFamily: fontFamily.medium,
          color: '#16181C',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default IndexTab;
