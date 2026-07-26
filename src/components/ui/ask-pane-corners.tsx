import { View } from 'react-native';

/** The decoration needs its OWN palette, NOT the field's (2026-07-25): the
 * background shades sit 1.01-1.05:1 against each other — invisible by design,
 * since they are a texture under content. Blocks drawn from them vanished
 * entirely. These are deeper cuts of the same desk-blue family (1.2-1.9:1
 * against the field), which is what lets the pattern actually read while still
 * belonging to it. */
const DECO = ['#8FB9DE', '#A9C8E4', '#B7D4EE'];

/** CELL is the decoration's own tile size — deliberately much smaller than the
 * background's architectural tiles (screen width / 5), because at that scale a
 * single block would swamp the pane. Same pattern, quoted small. */
const CELL = 7;

/** ONE block per corner (2026-07-25 "you can just do until the one squares of
 * each 4 edge"): the first cut stepped three blocks out per corner, tapering in
 * size and opacity. That read as decoration ABOUT the pane rather than a mark
 * ON it. A single square per corner is the whole ornament now — quieter, and it
 * lets the pane's own square edge do the talking.
 * `flipX` / `flipY` mirror it into the other three corners. */
const STEPS = [{ d: 0, size: 1, shade: 0, alpha: 0.9 }];

function Corner({ flipX, flipY }: { flipX?: boolean; flipY?: boolean }) {
  return (
    <>
      {STEPS.map((s, i) => {
        const side = CELL * s.size;
        // each step moves one full CELL further out along both axes
        const off = -CELL * s.d - side;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              [flipX ? 'right' : 'left']: off,
              [flipY ? 'bottom' : 'top']: off,
              width: side,
              height: side,
              backgroundColor: DECO[s.shade],
              opacity: s.alpha,
            }}
          />
        );
      })}
    </>
  );
}

/**
 * The ask pane's corner decoration (2026-07-25 "우리 체크 패턴 스타일을 네모
 * 끝에 좀 패턴을 넣어서 꾸며볼래?"): small square blocks stepping diagonally out
 * of all four corners of the white prompt pane, drawn in the mosaic field's own
 * shades so the pane reads as part of the same tile system.
 *
 * Corners only, never the edges: the pane is a READING surface, and a strip
 * along its top or bottom would crowd the sentence. Corners decorate without
 * entering the text's space.
 *
 * pointerEvents none throughout — this is pure ornament sitting outside the
 * pane's own box, and it must never eat a tap meant for the row.
 */
export function AskPaneCorners() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <Corner />
      <Corner flipX />
      <Corner flipY />
      <Corner flipX flipY />
    </View>
  );
}

export default AskPaneCorners;
