import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useIsFocused } from 'expo-router';

/**
 * "pulsing_border" — luminous color trails riding a glowing contour, a
 * SkSL port of Paper Design's pulsing-border shader (MIT,
 * github.com/paper-design/shaders), recolored to the blue family for
 * the CTA slabs: sky, silver-white, deep desk blue and an aqua spark
 * chasing each other around the button's edge. The "engine light."
 *
 * Port notes (GLSL ES3 → SkSL): fwidth() is unavailable in runtime
 * effects, so anti-aliasing width comes in as u_aa (≈1.5/min dimension,
 * computed from the measured box); the pre-baked noise texture became a
 * sin-dot hash (same trick as the banding fix); loops run to constant
 * bounds (4 colors × 4 spots, no break); margins/aspect modes are
 * hardcoded to zero/auto; output is unpremultiplied with a transparent
 * back so the glow composites over the Liquid Glass body beneath.
 */

const SKSL = `
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_aa;
uniform vec4 u_color0;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_roundness;
uniform float u_thickness;
uniform float u_softness;
uniform float u_intensity;
uniform float u_bloom;
uniform float u_spotSize;
uniform float u_pulse;
uniform float u_smoke;
uniform float u_smokeSize;
uniform float u_marginX;
uniform float u_marginY;
uniform float u_travel;

const float PI = 3.14159265358979;
const float TWO_PI = 6.28318530718;

vec4 getColor(int i) {
  if (i == 0) { return u_color0; }
  if (i == 1) { return u_color1; }
  if (i == 2) { return u_color2; }
  return u_color3;
}

float beat(float time) {
  float first = pow(abs(sin(time * TWO_PI)), 10.);
  float second = pow(abs(sin((time - .15) * TWO_PI)), 10.);
  return clamp(first + 0.6 * second, 0., 1.);
}

float sst(float edge0, float edge1, float x) {
  return smoothstep(edge0, edge1, x);
}

float roundedBox(vec2 uv, vec2 halfSize, float distance, float cornerDistance, float thickness, float softness) {
  float borderDistance = abs(distance);
  float aa = 2. * u_aa;
  float border = 1. - sst(min(mix(thickness, -thickness, softness), thickness + aa), max(mix(thickness, -thickness, softness), thickness + aa), borderDistance);
  float cornerFadeCircles = 0.;
  cornerFadeCircles = mix(1., cornerFadeCircles, sst(0., 1., length((uv + halfSize) / thickness)));
  cornerFadeCircles = mix(1., cornerFadeCircles, sst(0., 1., length((uv - vec2(-halfSize.x, halfSize.y)) / thickness)));
  cornerFadeCircles = mix(1., cornerFadeCircles, sst(0., 1., length((uv - vec2(halfSize.x, -halfSize.y)) / thickness)));
  cornerFadeCircles = mix(1., cornerFadeCircles, sst(0., 1., length((uv - halfSize) / thickness)));
  aa = u_aa;
  float cornerFade = sst(0., mix(aa, thickness, softness), cornerDistance);
  cornerFade *= cornerFadeCircles;
  border += cornerFade;
  return border;
}

float hash1(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}
vec2 randomGB(vec2 p) {
  return vec2(hash1(p), hash1(p + 17.17));
}
float randomG(vec2 p) {
  return hash1(floor(p));
}
float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = randomG(i);
  float b = randomG(i + vec2(1., 0.));
  float c = randomG(i + vec2(0., 1.));
  float d = randomG(i + vec2(1., 1.));
  vec2 u = f * f * (3. - 2. * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 main(vec2 fragCoord) {
  const float firstFrameOffset = 109.;
  float t = 1.2 * (u_time + firstFrameOffset);

  vec2 borderUV = fragCoord / u_resolution - .5;
  borderUV.y = -borderUV.y;
  float canvasRatio = u_resolution.x / u_resolution.y;
  vec2 patternUV = (fragCoord - .5 * u_resolution) / min(u_resolution.x, u_resolution.y);

  float pulse = u_pulse * beat(.18 * u_time);

  vec2 halfSize = vec2(.5);
  borderUV.x *= max(canvasRatio, 1.);
  borderUV.y /= min(canvasRatio, 1.);
  halfSize.x *= max(canvasRatio, 1.);
  halfSize.y /= min(canvasRatio, 1.);

  float thickness = .5 * u_thickness * min(halfSize.x, halfSize.y);
  // inset the drawing box so the glow can radiate OUTSIDE the host's
  // bounds (the canvas is oversized by the bleed; margins shrink the
  // border shape back to the host's edge)
  halfSize.x *= (1. - 2. * u_marginX);
  halfSize.y *= (1. - 2. * u_marginY);
  halfSize -= mix(thickness, 0., u_softness);

  float radius = mix(0., min(halfSize.x, halfSize.y), u_roundness);
  vec2 dd = abs(borderUV) - halfSize + radius;
  float outsideDistance = length(max(dd, .0001)) - radius;
  float insideDistance = min(max(dd.x, dd.y), .0001);
  float cornerDistance = abs(min(max(dd.x, dd.y) - .45 * radius, .0));
  float distance = outsideDistance + insideDistance;

  float borderThickness = mix(thickness, 3. * thickness, u_softness);
  float border = roundedBox(borderUV, halfSize, distance, cornerDistance, borderThickness, u_softness);
  border = pow(border, 1. + u_softness);

  vec2 smokeUV = .3 * u_smokeSize * patternUV;
  float smoke = clamp(3. * valueNoise(2.7 * smokeUV + .5 * t), 0., 1.);
  smoke -= valueNoise(3.4 * smokeUV - .5 * t);
  float smokeThickness = thickness + .2;
  smokeThickness = min(.4, max(smokeThickness, .1));
  smoke *= roundedBox(borderUV, halfSize, distance, cornerDistance, smokeThickness, 1.);
  smoke = 30. * smoke * smoke;
  smoke *= mix(0., .5, pow(u_smoke, 2.));
  smoke *= mix(1., pulse, u_pulse);
  smoke = clamp(smoke, 0., 1.);
  border += smoke;
  border = clamp(border, 0., 1.);

  vec3 blendColor = vec3(0.);
  float blendAlpha = 0.;
  vec3 addColor = vec3(0.);
  float addAlpha = 0.;

  float bloom = 4. * u_bloom;
  float intensity = 1. + (1. + 4. * u_softness) * u_intensity;

  float angle = atan(borderUV.y, borderUV.x) / TWO_PI;

  for (int colorIdx = 0; colorIdx < 4; colorIdx++) {
    float colorIdxF = float(colorIdx);
    vec4 col = getColor(colorIdx);
    vec3 c = col.rgb * col.a;
    float a = col.a;

    for (int spotIdx = 0; spotIdx < 4; spotIdx++) {
      float spotIdxF = float(spotIdx);

      vec2 randVal = randomGB(vec2(spotIdxF * 10. + 2., 40. + colorIdxF));

      // u_travel separates ORBIT from BREATH: 1 = spots ride around the
      // contour (the preset's liquid feel), 0 = spots hold their random
      // positions and only their brightness breathes (still neon)
      float time = (.1 + .15 * abs(sin(spotIdxF * (2. + colorIdxF)) * cos(spotIdxF * (2. + 2.5 * colorIdxF)))) * t * u_travel + randVal.x * 3.;
      time *= mix(1., -1., step(.5, randVal.y));

      float mask = .5 + .5 * mix(
        sin(t + spotIdxF * (5. - 1.5 * colorIdxF)),
        cos(t + spotIdxF * (3. + 1.3 * colorIdxF)),
        step(mod(colorIdxF, 2.), .5)
      );

      float p = clamp(2. * u_pulse - randVal.x, 0., 1.);
      mask = mix(mask, pulse, p);

      float atg1 = fract(angle + time);
      float spotSize = .05 + .6 * pow(u_spotSize, 2.) + .05 * randVal.x;
      spotSize = mix(spotSize, .1, p);
      float sector = sst(.5 - spotSize, .5, atg1) * (1. - sst(.5, .5 + spotSize, atg1));

      sector *= mask;
      sector *= border;
      sector *= intensity;
      sector = clamp(sector, 0., 1.);

      vec3 srcColor = c * sector;
      float srcAlpha = a * sector;

      blendColor += ((1. - blendAlpha) * srcColor);
      blendAlpha = blendAlpha + (1. - blendAlpha) * srcAlpha;
      addColor += srcColor;
      addAlpha += srcAlpha;
    }
  }

  vec3 accumColor = mix(blendColor, addColor, bloom);
  float accumAlpha = mix(blendAlpha, addAlpha, bloom);
  accumAlpha = clamp(accumAlpha, 0., 1.);

  vec3 outRGB = accumAlpha > .001 ? accumColor / accumAlpha : vec3(0.);
  outRGB = clamp(outRGB, 0., 1.);
  return vec4(outRGB, accumAlpha);
}
`;

const effect = Skia.RuntimeEffect.Make(SKSL);
if (!effect && __DEV__) {
  console.warn('[pulsing-border] SkSL failed to compile; border disabled');
}

/** #rrggbb or #rrggbbaa → [r,g,b,a] (alpha dims the emitted light) */
function vec4(hex: string, a = 1): number[] {
  const h = hex.slice(1);
  const n = parseInt(h.slice(0, 6), 16);
  const alpha = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : a;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alpha];
}

// The glow: WHITE only (2026-07-14 final call: "색깔 없이 흰색으로만") —
// four white spots, so the ring is pure light; color history (blues,
// one-look aqua) lives in git.
const GLOW = [vec4('#FFFFFF'), vec4('#FFFFFF'), vec4('#FFFFFF'), vec4('#FFFFFF')];

// The user's preset (2026-07-14): full-round capsule (roundness 1,
// matches the hosts' pill radius), and near-static motion — SPEED far
// below the preset's 1 per "거의 정적에 가까울 정도의 굉장히 적은 모션".
const PARAMS = {
  u_roundness: 1,
  u_thickness: 0.05,
  u_softness: 0.75,
  u_intensity: 0.2,
  u_bloom: 0.25,
  u_spotSize: 0.5,
  u_pulse: 0.25,
  u_smoke: 0.15,
  u_smokeSize: 0.6,
};
const SPEED = 0.08;

/**
 * Absolute-fill pulsing neon border. Parent must be relative with
 * overflow hidden; measures itself via onLayout. Pass `colors` (1-4
 * hexes, repeated to fill the 4 spot slots) to override the white set —
 * e.g. the command bar's single #0dc1fd electric cyan.
 */
export function PulsingBorderFill({
  animated = true,
  colors,
  roundness = PARAMS.u_roundness,
  thickness = PARAMS.u_thickness,
  softness = PARAMS.u_softness,
  smoke = PARAMS.u_smoke,
  speed = SPEED,
  spotSize = PARAMS.u_spotSize,
  bleed = 0,
  travel = 1,
}: {
  animated?: boolean;
  colors?: string[];
  /** 1 = capsule (default), ~0 = square — match the host's own radius */
  roundness?: number;
  /** border base width; smaller = finer line (default 0.05) */
  thickness?: number;
  /** halo spread; smaller = crisper line (default 0.75) */
  softness?: number;
  /** noisy glow extension — scales with the BOX (0.2 of min dimension),
   * so on small pills it swamps the line; 0 = crisp ring only */
  smoke?: number;
  /** time multiplier; default near-static 0.08, preset motion = 1 */
  speed?: number;
  /** angular arc length of each light spot; smaller = shorter faint
   * streaks with real gaps (default 0.5 ≈ half the perimeter) */
  spotSize?: number;
  /** points the halo may radiate BEYOND the host's bounds. Needs the
   * host to NOT clip this fill (place it outside overflow:hidden). 0 =
   * old behavior, glow clipped at the edge reads as a hard line. */
  bleed?: number;
  /** 1 = light orbits the contour (liquid feel), 0 = light holds its
   * position and only breathes in place (true neon-tube feel) */
  travel?: number;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const clock = useClock();
  const isFocused = useIsFocused();
  const focusedSV = useSharedValue(1);
  const frozenMs = useSharedValue(0);

  useEffect(() => {
    focusedSV.value = isFocused ? 1 : 0;
  }, [isFocused, focusedSV]);

  // Unused slots go TRANSPARENT (not repeated): repeating one color
  // into all 4 slots stacks 16 same-color spots into a solid ring with
  // no gaps — transparent padding keeps the true 4-spot arcs that
  // travel around the contour like neon.
  const glow = colors?.length
    ? Array.from({ length: 4 }, (_, i) =>
        i < colors.length ? vec4(colors[i]) : [0, 0, 0, 0]
      )
    : GLOW;

  const uniforms = useDerivedValue(() => {
    let time = 0;
    if (animated) {
      let ms = frozenMs.value;
      if (focusedSV.value === 1) {
        ms = clock.value;
        frozenMs.value = ms;
      }
      time = (ms / 1000) * speed;
    }
    return {
      u_resolution: [box.w, box.h],
      u_time: time,
      u_aa: 1.5 / Math.max(1, Math.min(box.w, box.h)),
      u_color0: glow[0],
      u_color1: glow[1],
      u_color2: glow[2],
      u_color3: glow[3],
      ...PARAMS,
      u_roundness: roundness,
      u_thickness: thickness,
      u_softness: softness,
      u_smoke: smoke,
      u_spotSize: spotSize,
      u_marginX: box.w > 0 ? bleed / box.w : 0,
      u_marginY: box.h > 0 ? bleed / box.h : 0,
      u_travel: travel,
    };
  }, [box, animated, glow, roundness, thickness, softness, smoke, speed, spotSize, bleed, travel]);

  return (
    <View
      style={{
        position: 'absolute',
        top: -bleed,
        left: -bleed,
        right: -bleed,
        bottom: -bleed,
      }}
      pointerEvents="none"
      onLayout={(e) =>
        setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }>
      {effect && box.w > 0 ? (
        <Canvas style={{ flex: 1 }}>
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        </Canvas>
      ) : null}
    </View>
  );
}

export default PulsingBorderFill;
