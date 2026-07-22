import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useIsFocused } from 'expo-router';

/**
 * "mesh_gradient" — a living four-color mesh in the spirit of Paper
 * Design's MeshGradient (github.com/paper-design/shaders, MIT), written
 * as SkSL the same way pulsing-border.tsx ports their border shader
 * (the react package is DOM-canvas only, so it can't run in Expo).
 *
 * Four color anchors drift slowly around the box; each fragment blends
 * them by inverse-square distance after a swirl (radius-scaled
 * rotation) and a sin/cos domain warp (distortion). With near-identical
 * colors the result is a surface that BREATHES rather than a rainbow —
 * the YOUR TURN card's alive backdrop.
 */

const SKSL = `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_color0;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_distortion;
uniform float u_swirl;

vec4 main(vec2 fragCoord) {
  vec2 uv = fragCoord / u_resolution;
  float t = u_time;
  float aspect = u_resolution.x / max(u_resolution.y, 1.);

  vec2 p = uv - .5;
  p.x *= aspect;

  // swirl: rotation growing with radius
  float r = length(p);
  float ang = u_swirl * 4. * r;
  float ca = cos(ang);
  float sa = sin(ang);
  p = mat2(ca, -sa, sa, ca) * p;

  // distortion: slow sin/cos domain warp
  p += u_distortion * .12 * vec2(
    sin(2.3 * p.y + .7 * t) + .5 * sin(3.7 * p.x + .53 * t),
    cos(2.1 * p.x + .61 * t) + .5 * cos(3.1 * p.y + .8 * t)
  );

  // four anchors drifting on incommensurate tempos
  vec2 a0 = vec2(-.35 * aspect + .10 * sin(.31 * t), -.30 + .08 * cos(.27 * t));
  vec2 a1 = vec2( .35 * aspect + .09 * cos(.23 * t), -.28 + .10 * sin(.29 * t));
  vec2 a2 = vec2(-.32 * aspect + .10 * cos(.21 * t),  .30 + .09 * sin(.33 * t));
  vec2 a3 = vec2( .34 * aspect + .08 * sin(.26 * t),  .31 + .10 * cos(.22 * t));

  float w0 = 1. / (dot(p - a0, p - a0) + .03);
  float w1 = 1. / (dot(p - a1, p - a1) + .03);
  float w2 = 1. / (dot(p - a2, p - a2) + .03);
  float w3 = 1. / (dot(p - a3, p - a3) + .03);

  vec3 col = (u_color0.rgb * w0 + u_color1.rgb * w1 + u_color2.rgb * w2 + u_color3.rgb * w3)
    / (w0 + w1 + w2 + w3);
  return vec4(col, 1.);
}
`;

const effect = Skia.RuntimeEffect.Make(SKSL);
if (!effect && __DEV__) {
  console.warn('[mesh-gradient] SkSL failed to compile; mesh disabled');
}

/** #rrggbb → [r,g,b,1] */
function vec4(hex: string): number[] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

export function MeshGradientFill({
  colors,
  distortion = 0.8,
  swirl = 0.1,
  speed = 1,
}: {
  /** exactly 4 hexes, Paper's API shape */
  colors: [string, string, string, string];
  distortion?: number;
  swirl?: number;
  /** time multiplier; keep well under 1 for the barely-alive feel */
  speed?: number;
}) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const clock = useClock();
  const isFocused = useIsFocused();
  const focusedSV = useSharedValue(1);
  const frozenMs = useSharedValue(0);

  useEffect(() => {
    focusedSV.value = isFocused ? 1 : 0;
  }, [isFocused, focusedSV]);

  const c = colors.map(vec4);

  const uniforms = useDerivedValue(() => {
    let ms = frozenMs.value;
    if (focusedSV.value === 1) {
      ms = clock.value;
      frozenMs.value = ms;
    }
    return {
      u_resolution: [box.w, box.h],
      u_time: (ms / 1000) * speed,
      u_color0: c[0],
      u_color1: c[1],
      u_color2: c[2],
      u_color3: c[3],
      u_distortion: distortion,
      u_swirl: swirl,
    };
  }, [box, c, distortion, swirl, speed]);

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
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

export default MeshGradientFill;
