/** YOU (2026-07-25) — the human, not a crew member.
 *
 * TWO MARKS, split by context. This file's photo is no longer the only
 * one: there is also a `me` PIXEL FACE in crew-pixel.tsx, drawn in the
 * crew's own 24-grid.
 *   - PHOTO (here): the Home header lockup, and the digest's Completed
 *     rows (away-digest.tsx). Wherever no crew face sits beside it, a
 *     real photograph is the better account mark.
 *   - PIXEL (`<CrewPixel id="me" />`): Home's Suggestions rows, where
 *     your ask sits directly next to a crew member's ask.
 *
 * An earlier version of this comment claimed the photo was "deliberately
 * unlike the crew's drawn pixel faces" and that the difference in
 * material WAS the you-vs-agent signal. In practice ("너무 다른 데랑
 * 프로필이 이질감이들어서") that clash cost more than the signal bought,
 * at least in dense list rows. Authorship still reads without it — the
 * long center-parted hair is plainly not one of the four crew.
 *
 * Wherever the photo IS used, alignment must still match exactly (same
 * box size as CrewPixel), only the material differs.
 *
 * me.png is a PREPARED asset, not the raw photo (2026-07-25):
 *   1. background removed ("배경 지우기") with Apple's Vision
 *      VNGeneratePersonSegmentationRequest (.accurate) — real alpha, so
 *      the avatar sits ON the card like the crew's transparent faces
 *   2. cropped to HEAD + HAIR at ~1.45x the Vision-detected face box,
 *      shoulders excluded ("얼굴사이즈가 너무 작아 다른 크루처럼") — an
 *      untrimmed portrait leaves the head tiny inside a 20px circle
 *   3. bottom 30px of alpha ramped to 0 so the neck fades out
 * NO color grading: natural skin tone ("원래얼굴 사진쓰기"). An earlier
 * blue-veiled version was rejected as too dark.
 *
 * me-original.jpg is the untouched source, kept so the crop or cutout
 * can be redone without asking Ellie for the file again.
 *
 * PNG is preferred and .jpg is the fallback ONLY because a JPEG cannot
 * carry transparency — if you ever swap in a new photo, prefer a PNG
 * cutout; a .jpg will silently bring its background back.
 */
let photo: number | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  photo = require('../../assets/user/me.png');
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    photo = require('../../assets/user/me.jpg');
  } catch {
    photo = null;
  }
}

export const USER_PHOTO = photo;

/** YOUR PIXEL MARK (2026-07-25 "using my profile but not too realistic") —
 * the same photo, processed rather than redrawn.
 *
 * Why not a hand-drawn face: one was attempted and rejected ("이게 나라는게
 * 없는데... 프로필로부터 나온느낌이없어서"). Five approaches were tried and
 * rendered; a 24-grid single-ink face cannot carry a likeness, and long hair
 * in particular fuses with the face outline into a thick border. Processing
 * the real photo keeps the geometry that makes it recognisably HER, which is
 * exactly what hand-drawing kept losing.
 *
 * assets/user/me-pixel.png is prepared, not raw:
 *   1. luminance -> DUOTONE, #1E334D to #F2F7FC, contrast-boosted (autocontrast
 *      cutoff 6) so the eyes and smile survive being shrunk
 *   2. downsampled to a 28 grid, then blown back up 8x with NEAREST so the
 *      pixel edges stay hard at any render size (asset is 224px)
 *   3. alpha carried from me.png, so the background stays removed
 *
 * The duotone is the point: it puts her in the crew's own blue ink, so she
 * stops reading as a photograph pasted beside illustrations. The cost, chosen
 * knowingly, is that her natural skin tone is gone.
 *
 * NO DOT TEXTURE. A dithered version was tried on 2026-07-25 ("약간더 도트를
 * 넣어줘") and reverted the same day: "도트가끼니까 화질이 안좋아보여서" — the
 * dots read as low image QUALITY rather than as a deliberate style. Do not
 * re-add halftone, Bayer dithering, or a dot lattice here. The pixel-block
 * downsample in step 2 is already the whole stylisation.
 *
 * To regenerate after swapping the source photo, redo those three steps from
 * me-original.jpg — the ink endpoints and the 28 grid are the values worth
 * preserving. */
let pixel: number | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  pixel = require('../../assets/user/me-pixel.png');
} catch {
  pixel = null;
}

export const USER_PIXEL = pixel;

export const USER_NAME = 'Ellie';
