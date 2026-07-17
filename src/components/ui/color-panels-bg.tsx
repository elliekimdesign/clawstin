import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Blur, Canvas, Fill, Group, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useIsFocused } from 'expo-router';
import { AcidSwooshBg } from './acid-swoosh-bg';

/**
 * "color_panels" — the desk field as glowing translucent 3D panels
 * rotating around a horizontal central axis. A SkSL port of Paper
 * Design's color-panels shader (MIT, github.com/paper-design/shaders),
 * recolored for the aqua desk: silver-white and desk-blue panes on the
 * same deep blue the swoosh field used, so the silver windows float on
 * a living version of the desk instead of a still one.
 *
 * Port notes (GLSL ES3 → SkSL): the 7-color array became u_color0..6
 * with an if-chain accessor (no dynamic indexing in runtime effects),
 * loops run to constant bounds with if-guards instead of break/continue,
 * u_edges is a float flag, and v_objectUV is recomputed from fragCoord
 * (contain-fit, Y-up). Colors are premultiplied JS-side.
 */

const SKSL = `
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scale;
uniform vec4 u_color0;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform vec4 u_color4;
uniform vec4 u_color5;
uniform vec4 u_color6;
uniform vec4 u_colorBack;
uniform float u_density;
uniform float u_angle1;
uniform float u_angle2;
uniform float u_length;
uniform float u_edges;
uniform float u_blur;
uniform float u_fadeIn;
uniform float u_fadeOut;
uniform float u_gradient;

const float PI = 3.14159265358979;
const float TWO_PI = 6.28318530718;
const float zLimit = .5;

vec4 getColor(int i) {
  if (i == 0) { return u_color0; }
  if (i == 1) { return u_color1; }
  if (i == 2) { return u_color2; }
  if (i == 3) { return u_color3; }
  if (i == 4) { return u_color4; }
  if (i == 5) { return u_color5; }
  return u_color6;
}

vec2 getPanel(float angle, vec2 uv, float invLength, float aa) {
  float sinA = sin(angle);
  float cosA = cos(angle);

  float denom = sinA - uv.y * cosA;
  if (abs(denom) < .01) { return vec2(0.); }

  float z = uv.y / denom;
  if (z <= 0. || z > zLimit) { return vec2(0.); }

  float zRatio = z / zLimit;
  float panelMap = 1. - zRatio;
  float x = uv.x * (cosA * z + 1.) * invLength;

  float zOffset = zRatio - .5;
  float left = -.5 + zOffset * u_angle1;
  float right = .5 - zOffset * u_angle2;
  float blurX = aa + 2. * panelMap * u_blur;

  float panel = smoothstep(left - blurX, left + .25 * blurX, x)
    * (1. - smoothstep(right - .25 * blurX, right + blurX, x));
  panel *= mix(0., panel, smoothstep(0., .01 / max(u_scale, 1e-6), panelMap));

  float midScreen = abs(sinA);
  if (u_edges > .5) {
    panelMap = mix(.99, panelMap, panel * clamp(panelMap / (.15 * (1. - pow(midScreen, .1))), 0., 1.));
  } else if (midScreen < .07) {
    panel *= (midScreen * 15.);
  }

  return vec2(panel, panelMap);
}

vec4 blendColor(vec4 colorA, float panelMask, float panelMap) {
  float fade = 1. - smoothstep(.97 - .97 * u_fadeIn, 1., panelMap);
  fade *= smoothstep(-.2 * (1. - u_fadeOut), u_fadeOut, panelMap);
  vec3 blendedRGB = mix(vec3(0.), colorA.rgb, fade);
  float blendedAlpha = mix(0., colorA.a, fade);
  return vec4(blendedRGB, blendedAlpha) * panelMask;
}

vec4 main(vec2 fragCoord) {
  vec2 uv = fragCoord / u_resolution - .5;
  uv.y = -uv.y;
  uv *= u_resolution / min(u_resolution.x, u_resolution.y);
  uv /= u_scale;
  uv *= 1.25;

  float t = fract(.02 * u_time);
  bool reverseTime = (t < .5);

  vec3 color = vec3(0.);
  float opacity = 0.;

  float aa = .005 / u_scale;
  float invLength = 1.5 / max(u_length, .001);
  float panelGrad = 1. - clamp(u_gradient, 0., 1.);

  float offA = reverseTime ? .5 : 0.;
  float offB = reverseTime ? 0. : .5;

  for (int i = 0; i < 14; i++) {
    int idx = 13 - i;

    float offset = float(idx) / 14. + offA;
    float densityFract = 1.17 * fract(t + offset);
    float angleNorm = densityFract / u_density;
    if (densityFract < .5 && angleNorm < .3) {
      float smoothDensity = clamp((.5 - densityFract) / .1, 0., 1.) * clamp(densityFract / .01, 0., 1.);
      float smoothAngle = clamp((.3 - angleNorm) / .05, 0., 1.);
      if (smoothDensity * smoothAngle >= .001) {
        vec2 panel = getPanel(angleNorm * TWO_PI + PI, uv, invLength, aa);
        if (panel.x > .001) {
          float panelMask = panel.x * smoothDensity * smoothAngle;
          float panelMap = panel.y;

          int colorIdx = idx < 7 ? idx : idx - 7;
          int nextColorIdx = colorIdx == 6 ? 0 : colorIdx + 1;
          vec4 colorA = getColor(colorIdx);
          vec4 colorB = getColor(nextColorIdx);
          colorA = mix(colorA, colorB, max(0., smoothstep(.0, .45, panelMap) - panelGrad));

          vec4 blended = blendColor(colorA, panelMask, panelMap);
          color = blended.rgb + color * (1. - blended.a);
          opacity = blended.a + opacity * (1. - blended.a);
        }
      }
    }
  }

  for (int i = 0; i < 14; i++) {
    int idx = 13 - i;

    float offset = float(idx) / 14. + offB;
    float densityFract = 1.17 * fract(-t + offset);
    float angleNorm = -densityFract / u_density;
    if (densityFract < .5 && angleNorm >= -.3) {
      float smoothDensity = clamp((.5 - densityFract) / .1, 0., 1.) * clamp(densityFract / .01, 0., 1.);
      float smoothAngle = clamp((angleNorm + .3) / .05, 0., 1.);
      if (smoothDensity * smoothAngle >= .001) {
        vec2 panel = getPanel(angleNorm * TWO_PI + PI, uv, invLength, aa);
        float panelMask = panel.x * smoothDensity * smoothAngle;
        if (panelMask > .001) {
          float panelMap = panel.y;

          int m = idx < 7 ? idx : idx - 7;
          int colorIdx = m == 0 ? 0 : 7 - m;
          int nextColorIdx = colorIdx == 6 ? 0 : colorIdx + 1;
          vec4 colorA = getColor(colorIdx);
          vec4 colorB = getColor(nextColorIdx);
          colorA = mix(colorA, colorB, max(0., smoothstep(.0, .45, panelMap) - panelGrad));

          vec4 blended = blendColor(colorA, panelMask, panelMap);
          color = blended.rgb + color * (1. - blended.a);
          opacity = blended.a + opacity * (1. - blended.a);
        }
      }
    }
  }

  vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
  color = color + bgColor * (1. - opacity);
  opacity = opacity + u_colorBack.a * (1. - opacity);

  color += 1. / 256. * (fract(sin(dot(.014 * fragCoord, vec2(12.9898, 78.233))) * 43758.5453123) - .5);

  return vec4(color, opacity);
}
`;

const effect = Skia.RuntimeEffect.Make(SKSL);
if (!effect && __DEV__) {
  console.warn('[color-panels-bg] SkSL failed to compile; falling back to AcidSwooshBg');
}

/** #rrggbb → premultiplied [r,g,b,a] (all panes are alpha 1). */
function vec4(hex: string, a = 1): number[] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return [r * a, g * a, b * a, a];
}

// Two colorways of the same panes:
// - desk: the aqua remap of the paper preset's 7 panes, light/deep
//   alternation so neighboring panes keep contrast (silver-white plays
//   the "hot" pane the preset gave to red); colorBack = the desk blue.
// - paper: the onboarding start field's light world — silver-white and
//   the start screen's own soft glow blues on the pale paper gray, so
//   ink text and the black CTA stay fully legible.
const PALETTES = {
  desk: {
    back: vec4('#4E83B8'),
    panes: [
      vec4('#8FC0E8'), // light sky glow
      vec4('#FFFFFF'), // silver-white highlight
      vec4('#6297CE'), // mid desk blue
      vec4('#33689C'), // deep blue anchor
      vec4('#3B76C4'), // system accent
      vec4('#C7DDF2'), // pale silver-blue
      vec4('#B7D4EE'), // soft light blue
    ],
  },
  // Home's wash colorway (2026-07-16, "다양하게. 너무 흰색은 쓰지
  // 않기"): the desk panes re-cut for the flattened light field —
  // white dropped for a blue-tinted pale, two new mid-blues for
  // variety, all inside the aqua family (no purple/pink, ever)
  deskWash: {
    back: vec4('#4E83B8'),
    panes: [
      vec4('#8FC0E8'), // light sky glow
      vec4('#DFEAF6'), // palest blue (the old white, tinted)
      vec4('#5E8FC8'), // clear mid blue
      vec4('#33689C'), // deep blue anchor
      vec4('#79B4E4'), // cerulean
      vec4('#C7DDF2'), // pale silver-blue
      vec4('#4A7FB5'), // dusty deep
    ],
  },
  // the individual CHAT screen's own wash (2026-07-16, "채팅창만 밝은
  // 파랑으로... 디자인 패턴은 그대로") — same gradient pattern/pane
  // structure as deskWash, split into its own variant so Home's blue
  // stays untouched: lifted lighter, a clear midday sky instead of the
  // deeper ocean blue. Stays vivid, not desaturated.
  chatWash: {
    back: vec4('#6FA3DC'),
    panes: [
      vec4('#B0D6F5'), // light sky glow, lifted
      vec4('#F0F7FC'), // palest blue, lifted
      vec4('#87BCE9'), // clear mid blue, lifted
      vec4('#5590C7'), // deep blue anchor, lifted
      vec4('#A0CCF0'), // cerulean, lifted
      vec4('#DCEDFA'), // pale silver-blue, lifted
      vec4('#6FA0D0'), // dusty deep, lifted
    ],
  },
  paper: {
    // full-bright by request (2026-07-16): pure white field, the fan's
    // own blues carry all the color
    back: vec4('#FFFFFF'),
    panes: [
      vec4('#FFFFFF'), // warm paper light
      vec4('#A7CBEF'), // the start field's sky glow
      vec4('#E4E9EE'), // silver
      vec4('#8FB9EF'), // the start field's meadow blue
      vec4('#C7DDF2'), // pale silver-blue
      vec4('#F2F6FB'), // near-white sheen
      vec4('#B7D4EE'), // soft light blue
    ],
  },
} as const;

export type ColorPanelsVariant = keyof typeof PALETTES;

// Paper preset: density=3 angle=0/0 length=1.1 edges blur=0
// fadeIn=1 fadeOut=0.3 gradient=0 speed=0.5 scale=0.8 — colorBack
// matches each screen's own base color so the canvas edges blend.
const SPEED = 0.5;
// The frozen frame for animated={false} (the start screen): a phase
// whose fan reads balanced around the axis. In shader time-space this
// is u_time seconds; tune by screenshot, Fast Refresh applies it.
const STATIC_TIME_S = 12.5;
const PRESETS = {
  /** the original mid-screen 3D fan — panels visibly rotate around the
   * horizontal axis (start screen, Crew, Activity) */
  fan: {
    u_scale: 0.8,
    u_density: 3,
    u_angle1: 0,
    u_angle2: 0,
    u_length: 1.1,
    u_edges: 1,
    u_blur: 0,
    u_fadeIn: 1,
    u_fadeOut: 0.3,
    u_gradient: 0,
  },
  /** the same rotation flattened into a full-screen light WASH
   * (2026-07-16, Home only): zoomed in and blurred so the turning
   * panels read as subtle light sweeping behind EVERY window — the
   * sections stay consistent because none sits outside the fan */
  wash: {
    u_scale: 2,
    // denser fan = narrower band spacing ("폭 간격을 약간 더 좁게")
    u_density: 4.5,
    u_angle1: 0,
    u_angle2: 0,
    u_length: 3,
    // no lines (2026-07-16 "선은없애고"): edge highlights off, blur
    // maxed, per-panel color gradation on — pure light and gradient
    u_edges: 0,
    u_blur: 1,
    u_fadeIn: 1,
    u_fadeOut: 0.5,
    u_gradient: 1,
  },
} as const;
export type ColorPanelsPreset = keyof typeof PRESETS;

export function ColorPanelsBg({
  variant = 'desk',
  animated = true,
  preset = 'fan',
  speed = SPEED,
  seamSoften = 0,
}: {
  variant?: ColorPanelsVariant;
  /** false = one frozen frame; true = live motion at `speed`. */
  animated?: boolean;
  /** 'fan' = the 3D mid-screen fan; 'wash' = the flattened full-screen
   * light sweep (Home board). */
  preset?: ColorPanelsPreset;
  /** u_time multiplier — defaults to the shared SPEED (0.5); the start
   * screen runs slower (2026-07-16, "slowly moving") for a calmer
   * first impression than the board's own motion. */
  speed?: number;
  /** a very light post-blur (px) to soften visible panel-to-panel
   * seams on a FROZEN frame (2026-07-16, "선이 좀 보이는데 아주 약간
   * 블랜딩") — 0 = off, the shader's own dither is usually enough;
   * only the chat screen's static wash needed a touch more. */
  seamSoften?: number;
}) {
  const { width, height } = useWindowDimensions();
  const clock = useClock();
  const isFocused = useIsFocused();
  const focusedSV = useSharedValue(1);
  // the time the field froze at when the tab lost focus, so an
  // offscreen Home doesn't keep the GPU spinning
  const frozenMs = useSharedValue(0);

  useEffect(() => {
    focusedSV.value = isFocused ? 1 : 0;
  }, [isFocused, focusedSV]);

  const palette = PALETTES[variant];
  const uniforms = useDerivedValue(() => {
    let time = STATIC_TIME_S;
    if (animated) {
      let ms = frozenMs.value;
      if (focusedSV.value === 1) {
        ms = clock.value;
        frozenMs.value = ms;
      }
      time = (ms / 1000) * speed;
    }
    return {
      u_resolution: [width, height],
      u_time: time,
      u_color0: palette.panes[0],
      u_color1: palette.panes[1],
      u_color2: palette.panes[2],
      u_color3: palette.panes[3],
      u_color4: palette.panes[4],
      u_color5: palette.panes[5],
      u_color6: palette.panes[6],
      u_colorBack: palette.back,
      ...PRESETS[preset],
    };
  }, [width, height, palette, animated, preset, speed]);

  if (!effect) return <AcidSwooshBg />;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ flex: 1 }}>
        {seamSoften > 0 ? (
          <Group layer>
            <Fill>
              <Shader source={effect} uniforms={uniforms} />
            </Fill>
            <Blur blur={seamSoften} />
          </Group>
        ) : (
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        )}
      </Canvas>
    </View>
  );
}

export default ColorPanelsBg;
