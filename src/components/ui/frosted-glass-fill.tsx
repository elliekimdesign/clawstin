import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
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
function boxPath(w: number, h: number, r: number, rBot = r) {
  return `
    M ${r},0
    L ${w - r},0
    Q ${w},0 ${w},${r}
    L ${w},${h - rBot}
    Q ${w},${h} ${w - rBot},${h}
    L ${rBot},${h}
    Q 0,${h} 0,${h - rBot}
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
  slant: number,
  // body corners (right of the flap + the bottom pair) — clamped
  // separately so short cards tighten BELOW while the flap's top
  // corners keep the family radius
  rBody = r,
  // the corner where the body's top edge meets the right side —
  // separate so a DOCKED layer can square its top while keeping its
  // bottom in the family radius
  rTopRight = rBody
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
    L ${w - rTopRight},${tabH}
    Q ${w},${tabH} ${w},${tabH + rTopRight}
    L ${w},${h - rBody}
    Q ${w},${h} ${w - rBody},${h}
    L ${rBody},${h}
    Q 0,${h} 0,${h - rBody}
    L 0,${r}
    Q 0,0 ${r},0
    Z
  `;
}

/** the FRONT outline with a MID-STRIP flap (tabStart > 0): the flap's
 * left edge runs the SAME "\" diagonal as the flush flap's closing cut
 * (2026-07-21 "반대방향, handled 끝나는 사선이랑 똑같이") — a
 * parallelogram tab, so the previous tab reads as sliding underneath
 * it — then crosses its top and cuts back down the same way. */
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
    L ${tabStart + slant + TR},${tabH}
    Q ${tabStart + slant},${tabH} ${tabStart + slant - dx},${tabH - dy}
    L ${tabStart + dx},${dy}
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
  flat = false,
  shine = false,
  dock = false,
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
  /** FLAT variant (2026-07-17 compose v2): a plain rounded rect that
   * still wears the folder's full glass skin — veil, sheen, grain,
   * rim — for surfaces that aren't folders (chips, composer,
   * popovers). No flap, no ghost layer. */
  flat?: boolean;
  /** while true the folder itself GLOWS (2026-07-22, RUNNING's alive
   * state): the whole silhouette breathes brighter and back — the
   * translucent folder look stays, it just lights up */
  shine?: boolean;
  /** DOCKED into a parent section (2026-07-22, the hero's Pitch layer):
   * ONE plate only — no ghost box behind the flap — with SQUARE top
   * ends (it meets the section's sides) and only the bottom corners
   * in the family radius. */
  dock?: boolean;
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
  // the glow breath (view-level opacity: reliable on the new arch)
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = shine
      ? withRepeat(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        )
      : withTiming(0, { duration: 300 });
  }, [shine, breath]);
  const shineStyle = useAnimatedStyle(() => ({
    opacity: breath.value * 0.3,
  }));
  const { w, h } = size;
  const ready = w > 0 && h > 0;
  const cut = slant ?? tabHeight;
  // split radii for short cards (e.g. the folded WYWA strip): the TOP
  // corners always keep the family radius so folded and open match at
  // the flap; only the body corners below the flap clamp to the room
  // that exists ((h - tabHeight) / 2) — unclamped, the right edge runs
  // backwards and spikes at the bottom corner
  const rTop = dock ? 0 : Math.min(radius, Math.max(3, h / 2 - 1));
  const rBody = flat
    ? rTop
    : Math.min(radius, Math.max(3, (h - tabHeight) / 2));
  const maxTabW = Math.max(40, w - Math.max(rTop, 8) - cut - 24 - tabStart);
  const tabW = Math.min(tabWidth, maxTabW);
  const front = ready
    ? flat
      ? boxPath(w, h, rTop)
      : tabStart > 0
        ? midTabPath(w, h, rBody, tabStart, tabW, tabHeight, cut)
        : folderPath(w, h, rTop, tabW, tabHeight, cut, rBody, dock ? 0 : rBody)
    : '';
  const back = ready ? boxPath(w, h, rTop, rBody) : '';
  // DOCK anatomy (2026-07-22): no hairlines. The layer is its whisper
  // of veil plus a CONTACT SHADOW — a soft dark falloff just inside
  // the flap-shaped top edge, as if the parent glass overhangs the
  // folder tucked beneath. All straight, no rounding.
  const dockEdge = ready
    ? `M 0,0 L ${tabW},0 L ${tabW + cut},${tabHeight} L ${w},${tabHeight}`
    : '';
  const dockFill = ready
    ? `M 0,0 L ${tabW},0 L ${tabW + cut},${tabHeight} L ${w},${tabHeight}
       L ${w},${h - rBody} Q ${w},${h} ${w - rBody},${h}
       L ${rBody},${h} Q 0,${h} 0,${h - rBody} Z`
    : '';

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
            <ClipPath id="dockClip">
              <Path d={dockFill} />
            </ClipPath>
          </Defs>
          {/* GHOST: the full box behind — visible only where the front
              flap cuts away, so the folder still completes its shape.
              Flat cards have no cutaway, so no ghost. */}
          {!flat && !dock ? (
            <>
              <Path d={back} fill={ghostTint} />
              <Path d={back} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
            </>
          ) : null}
          {/* FRONT: the frosted plate. DOCKED layers ride the parent's
              glass (2026-07-22 "같은 톤"): no sheen, no grain — just
              the caller's whisper of veil and the straight top line. */}
          {/* docked layer wears the WAITING-TAB plate treatment
              (2026-07-22 "You 디자인처럼"): bright white glass with its
              own faint rim tracing the flap boundary — the same
              discoverable-button material as the digest's back tab */}
          {dock ? (
            <>
              <Path d={dockFill} fill={tint} />
              <Path
                d={dockFill}
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={1}
              />
            </>
          ) : null}
          {!dock ? (
            <>
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
            </>
          ) : null}
          {!dock ? (
            <Path d={front} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1} />
          ) : null}
        </Svg>
      ) : null}
      {/* the glow: the folder silhouette itself breathing brighter —
          a white copy of the front plate whose wrapper pulses to 30% */}
      {ready && shine ? (
        <Animated.View style={[StyleSheet.absoluteFill, shineStyle]} pointerEvents="none">
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            <Path d={front} fill="#FFFFFF" />
            <Path d={front} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default FrostedGlassFill;
