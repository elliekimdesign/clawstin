import { StyleSheet, View } from 'react-native';
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

/**
 * FLOW BAR (2026-07-22, v2 "그냥 시스템 파랑, 점점 진행"): the RUNNING
 * card's progress voice. A quiet gray GLASS capsule that gradually
 * FILLS with the system's running blue, left to right — a soft liquid
 * leading edge, an exhale when full, then it begins again. One color,
 * nothing loud; the slow fill itself is the "working" signal.
 */

const SKSL = `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_color;

vec4 main(vec2 fragCoord) {
  float asp = u_resolution.x / u_resolution.y;
  vec2 uv = fragCoord / u_resolution;
  uv.x *= asp;

  float t = u_time;
  // ~6s fill cycle
  float p = fract(t * .16);
  float fillX = p * (asp + .2) - .1;

  // liquid leading edge: a tiny vertical wave, never ruler-straight
  float wave = .05 * sin(uv.y * 6.2832 + t * 2.);
  float mask = 1. - smoothstep(fillX - .10 + wave, fillX + .10 + wave, uv.x);

  // full bar EXHALES out instead of snapping empty
  float alpha = mask * .5 * (1. - smoothstep(.96, 1., p));
  return vec4(u_color.rgb * alpha, alpha);
}
`;

const effect = Skia.RuntimeEffect.Make(SKSL);
if (!effect && __DEV__) {
  console.warn('[flow-bar] SkSL failed to compile; bar disabled');
}

// sysColor.running (#5E87C4) as vec4 — the one and only color here
const RUNNING_BLUE = [0x5e / 255, 0x87 / 255, 0xc4 / 255, 1];

export function FlowBar({
  width = 132,
  height = 8,
}: {
  width?: number;
  height?: number;
}) {
  const clock = useClock();
  const uniforms = useDerivedValue(() => ({
    u_resolution: [width, height],
    u_time: clock.value / 1000,
    u_color: RUNNING_BLUE,
  }));

  return (
    <View
      pointerEvents="none"
      style={{
        width,
        height,
        // the gray glass tube: quiet ink tint, capsule-rounded, with
        // the faintest white rim — the app's glass grammar in miniature
        backgroundColor: 'rgba(22,24,28,0.07)',
        borderRadius: height / 2,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
      }}>
      {effect ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        </Canvas>
      ) : null}
    </View>
  );
}

export default FlowBar;
