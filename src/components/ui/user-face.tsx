import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { USER_PHOTO, USER_PIXEL } from '@/mock/user';

/** YOUR face (2026-07-25) — a real photo among drawn pixel faces.
 *
 * NATURAL COLOR, no tint ("얼굴채도 어둡게한거 빼고 원래얼굴 사진쓰기").
 * An earlier pass veiled the photo in crew-ink blue at 20% to "match"
 * the muted pixel palette; it read as darkened rather than harmonized
 * and was pulled. The photo now shows its own colors — what makes it
 * belong is the CUTOUT and the FRAMING, not recoloring:
 *
 *   - assets/user/me.png has a real alpha channel (background removed
 *     with Apple's Vision person segmentation), so like the crew's
 *     transparent line faces it sits ON the card instead of being a
 *     filled photo disc
 *   - it is cropped to HEAD + HAIR, shoulders excluded, at ~1.45x the
 *     detected face box — the crew faces fill their frame the same way.
 *     An untrimmed portrait leaves the head tiny inside the circle,
 *     which is what read as "너무 작아" even at a matched box size.
 *   - the bottom 30px of alpha ramps to 0 so the neck fades out rather
 *     than ending on a hard cut line
 *
 * Because the framing lives in the ASSET, this component is now just a
 * box + circle mask. Re-cropping means regenerating the PNG (the source
 * is kept at assets/user/me-original.jpg), not editing numbers here.
 *
 * SIZING: drawn at `size + 2`, offset -1 per side. A circle inscribed
 * in N px reads smaller than CrewPixel's square SVG, which paints its
 * full N px; overflowing a hair matches them optically while the layout
 * box stays exactly `size`, so list columns keep a straight left edge.
 *
 * Falls back to the gray person glyph when no photo is installed, so a
 * missing assets/user/me.png can never break a screen.
 */
export function UserFace({
  size,
  ring,
  pixel,
}: {
  size: number;
  /** hairline in white — used at brand sizes (the header lockup) where
   * the pale hair edges would otherwise bleed into the blue desk; left
   * off in dense list rows where it muddies at 20px */
  ring?: boolean;
  /** the DUOTONE PIXEL cut instead of the photo (2026-07-25 "using my
   * profile but not too realistic"). Use it wherever your row sits next
   * to a drawn crew face — it shares their blue ink, so it reads as the
   * same family. The plain photo stays right where nothing drawn is
   * nearby (the header lockup). See src/mock/user.ts for how the asset
   * is made and why hand-drawing was abandoned. */
  pixel?: boolean;
}) {
  const source = pixel ? USER_PIXEL ?? USER_PHOTO : USER_PHOTO;
  if (!source) {
    return <Ionicons name="person-circle" size={size} color="rgba(22,24,28,0.4)" />;
  }
  const drawn = size + 2;
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={source}
        style={{
          position: 'absolute',
          top: -1,
          left: -1,
          width: drawn,
          height: drawn,
          borderRadius: drawn / 2,
          ...(ring
            ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' }
            : null),
        }}
        // the pixel cut must NOT be smoothed — bilinear filtering would
        // blur the hard pixel edges straight back into a soft photo
        contentFit="cover"
      />
    </View>
  );
}
