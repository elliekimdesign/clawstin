import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

/** A sparse dot scatter standing in for a noise/grain texture — SVG
 * filter primitives (feTurbulence) aren't reliably supported across RN
 * SVG renderers, so the frosted "grain" is faked with a fixed field of
 * tiny low-opacity dots instead. Cheap, deterministic, good enough at
 * the sizes these cards render. */
const GRAIN_DOTS = Array.from({ length: 70 }, (_, i) => {
  // simple LCG-ish scatter, no Math.random (keeps renders stable)
  const x = (i * 37 + (i % 7) * 13) % 100;
  const y = (i * 53 + (i % 5) * 19) % 100;
  const r = 0.4 + (i % 3) * 0.2;
  const o = 0.03 + (i % 4) * 0.015;
  return { x, y, r, o };
});

/** the full-box outline the GHOST layer wears: a plain rounded rect
 * over the card's whole footprint (tab notch included), so the folder
 * still completes into one box behind the front flap. */
function boxPath(w: number, h: number, r: number) {
  return `
    M ${r},0
    L ${w - r},0
    Q ${w},0 ${w},${r}
    L ${w},${h - r}
    Q ${w},${h} ${w - r},${h}
    L ${r},${h}
    Q 0,${h} 0,${h - r}
    L 0,${r}
    Q 0,0 ${r},0
    Z
  `;
}

// corner rounding along the flap joints: kept tiny (2026-07-17 "더
// 직선으로") so the edges read as crisp straight cuts, not swooshes
const TR = 3;

/** the FRONT folder outline, flap flush with the left edge: top-left
 * label flap whose right edge cuts DIAGONALLY down into the body's top
 * edge (2026-07-17 "대각선 스타일"), then the body continues as a
 * rounded card. One continuous path so fill/stroke/clip stay a single
 * shape. */
function folderPath(
  w: number,
  h: number,
  r: number,
  tabW: number,
  tabH: number,
  slant: number
) {
  // offset the joint curves' touch points down the slope so the tiny
  // bends stay tangent-smooth
  const len = Math.hypot(slant, tabH);
  const dx = (slant * TR) / len;
  const dy = (tabH * TR) / len;
  return `
    M ${r},0
    L ${tabW - TR},0
    Q ${tabW},0 ${tabW + dx},${dy}
    L ${tabW + slant - dx},${tabH - dy}
    Q ${tabW + slant},${tabH} ${tabW + slant + TR},${tabH}
    L ${w - r},${tabH}
    Q ${w},${tabH} ${w},${tabH + r}
    L ${w},${h - r}
    Q ${w},${h} ${w - r},${h}
    L ${r},${h}
    Q 0,${h} 0,${h - r}
    L 0,${r}
    Q 0,0 ${r},0
    Z
  `;
}

/** the FRONT outline with a MID-STRIP flap (tabStart > 0): the body's
 * top edge runs at y=tabH with its own rounded top-left corner, then
 * the flap rises as a STRAIGHT vertical edge at tabStart ("앞에는 그냥
 * 직선"), crosses its top, and cuts back down diagonally — the active
 * filter tab on the task list. */
function midTabPath(
  w: number,
  h: number,
  r: number,
  tabStart: number,
  tabW: number,
  tabH: number,
  slant: number
) {
  const tabEnd = tabStart + tabW;
  const len = Math.hypot(slant, tabH);
  const dx = (slant * TR) / len;
  const dy = (tabH * TR) / len;
  return `
    M ${r},${tabH}
    L ${tabStart - TR},${tabH}
    Q ${tabStart},${tabH} ${tabStart},${tabH - TR}
    L ${tabStart},${TR}
    Q ${tabStart},0 ${tabStart + TR},0
    L ${tabEnd - TR},0
    Q ${tabEnd},0 ${tabEnd + dx},${dy}
    L ${tabEnd + slant - dx},${tabH - dy}
    Q ${tabEnd + slant},${tabH} ${tabEnd + slant + TR},${tabH}
    L ${w - r},${tabH}
    Q ${w},${tabH} ${w},${tabH + r}
    L ${w},${h - r}
    Q ${w},${h} ${w - r},${h}
    L ${r},${h}
    Q 0,${h} 0,${h - r}
    L 0,${tabH + r}
    Q 0,${tabH} ${r},${tabH}
    Z
  `;
}

/**
 * FROSTED GLASS FOLDER — the "state of the art" section material
 * (2026-07-17 reference): a stacked folder. BACK layer = a translucent
 * blue full box completing the silhouette; FRONT layer = the frosted
 * flap-and-body plate whose notch edge cuts diagonally. Home-only for
 * now.
 */
export function FrostedGlassFill({
  radius = 16,
  tabWidth = 132,
  tabHeight = 26,
  tabStart = 0,
  slant,
  tint = 'rgba(255,255,255,0.55)',
  ghostTint = 'rgba(173,208,240,0.42)',
}: {
  radius?: number;
  /** width of the label flap */
  tabWidth?: number;
  /** how far the flap sits below the card's own top edge */
  tabHeight?: number;
  /** flap's left position. 0 = flush with the card's left edge; >0 =
   * a mid-strip tab bump with a straight vertical left edge (the task
   * list's active filter) */
  tabStart?: number;
  /** horizontal run of the flap's diagonal edge — defaults to
   * tabHeight so the cut stays 45° at any flap height */
  slant?: number;
  /** front plate veil — lower alpha = more field bleeds through */
  tint?: string;
  /** the see-through blue box layer behind the flap notch */
  ghostTint?: string;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };
  const { w, h } = size;
  const ready = w > 0 && h > 0;
  const cut = slant ?? tabHeight;
  const maxTabW = Math.max(40, w - radius - cut - 24 - tabStart);
  const tabW = Math.min(tabWidth, maxTabW);
  const front = ready
    ? tabStart > 0
      ? midTabPath(w, h, radius, tabStart, tabW, tabHeight, cut)
      : folderPath(w, h, radius, tabW, tabHeight, cut)
    : '';
  const back = ready ? boxPath(w, h, radius) : '';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {ready ? (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="frostSheen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.1} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
            <ClipPath id="frontClip">
              <Path d={front} />
            </ClipPath>
          </Defs>
          {/* GHOST: the full box behind — visible only where the front
              flap cuts away, so the folder still completes its shape */}
          <Path d={back} fill={ghostTint} />
          <Path d={back} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
          {/* FRONT: the frosted plate */}
          <Path d={front} fill={tint} />
          <Path d={front} fill="url(#frostSheen)" />
          <G clipPath="url(#frontClip)">
            {GRAIN_DOTS.map((dot, i) => (
              <Circle
                key={i}
                cx={(dot.x / 100) * w}
                cy={(dot.y / 100) * h}
                r={dot.r}
                fill="#16181C"
                fillOpacity={dot.o}
              />
            ))}
          </G>
          <Path d={front} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1} />
        </Svg>
      ) : null}
    </View>
  );
}

export default FrostedGlassFill;
