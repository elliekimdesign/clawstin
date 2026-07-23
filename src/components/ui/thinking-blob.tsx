import { StyleSheet, View } from 'react-native';
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

/**
 * The "thinking" indicator (2026-07-16, replacing the three-dot
 * TypingIndicator, "글치고나면... 뭐가 나오는걸로" — a metaballs
 * reference): soft blobs of the crew's own accent colors, melting
 * into and out of each other, small and quiet — a compact SkSL port
 * of the metaballs idea (same porting approach as color-panels-bg.tsx;
 * @paper-design/shaders-react itself is web-only, not usable in RN).
 */

const SKSL = `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_color0;
uniform vec4 u_color1;
uniform vec4 u_color2;

// classic metaball field: sum of 1/distance falloffs, thresholded
float ball(vec2 uv, vec2 center, float r) {
  return r * r / dot(uv - center, uv - center);
}

vec4 main(vec2 fragCoord) {
  vec2 uv = fragCoord / u_resolution;
  uv.x *= u_resolution.x / u_resolution.y;
  float asp = u_resolution.x / u_resolution.y;

  // FIXED center (2026-07-16, "가운데를 중심으로... 물체자체가
  // 중심없이 움직이지않고") — nothing orbits away from here anymore;
  // every ball is tethered close to this one point, so the mass reads
  // as ONE thing stretching/pulsing in place, not several things
  // drifting around an empty middle.
  vec2 center = vec2(0.5 * asp, 0.5);
  float t = u_time;

  // three small offsets from center, each breathing independently —
  // radius itself pulses too, so the silhouette expands/contracts in
  // many directions at once rather than just sliding sideways
  vec2 o0 = vec2(0.06 * sin(t * 1.7), 0.05 * cos(t * 2.3));
  vec2 o1 = vec2(0.055 * sin(t * 2.1 + 2.1), 0.06 * cos(t * 1.6 + 1.0));
  vec2 o2 = vec2(0.05 * sin(t * 1.4 + 4.2), 0.055 * cos(t * 2.6 + 3.0));

  float r0 = 0.15 + 0.025 * sin(t * 2.4);
  float r1 = 0.135 + 0.022 * sin(t * 1.9 + 1.5);
  float r2 = 0.125 + 0.024 * sin(t * 2.8 + 3.1);

  vec2 c0 = center + o0;
  vec2 c1 = center + o1;
  vec2 c2 = center + o2;

  float field = ball(uv, c0, r0) + ball(uv, c1, r1) + ball(uv, c2, r2);
  float edge = smoothstep(0.9, 1.15, field);
  if (edge <= 0.001) {
    return vec4(0.0);
  }

  // GLASS BEAD shading (2026-07-22 "영롱하게 뜨는 투명 유리알"):
  // the bead is mostly see-through in its middle and glows at its
  // silhouette (a fake fresnel from the field strength), with an
  // iridescent tint that slowly turns around the bead.
  // rim: field ~ threshold at the edge, large deep inside
  float rim = smoothstep(2.4, 1.0, field);

  // iridescence: the palette rotating around the bead's center
  float ang = atan(uv.y - center.y, uv.x - center.x) + t * 0.6;
  float s0 = 0.5 + 0.5 * sin(ang);
  float s1 = 0.5 + 0.5 * sin(ang + 2.094);
  float s2 = 0.5 + 0.5 * sin(ang + 4.189);
  vec3 irid = (u_color0.rgb * s0 + u_color1.rgb * s1 + u_color2.rgb * s2)
            / (s0 + s1 + s2);

  // specular: a small fixed skylight catching the upper-left
  vec2 specPos = center + vec2(-0.055, -0.075);
  float spec = smoothstep(0.075, 0.015, length(uv - specPos));

  // transparent body, luminous rim, white catch-light
  vec3 color = irid * (0.55 + 0.45 * rim) + vec3(spec * 0.9);
  float alpha = edge * (0.3 + 0.55 * rim);
  alpha = clamp(alpha + spec * 0.7, 0.0, 1.0);
  return vec4(color * alpha, alpha);
}
`;

const effect = Skia.RuntimeEffect.Make(SKSL);

function vec4(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

// the bead's iridescence (2026-07-22): pale sky, aqua, and a breath
// of mint — cool glassy hues only, no foreign color, so the glimmer
// stays aquaos
const COLORS = [vec4('#CFE8FC'), vec4('#5E9AE0'), vec4('#8FE8CF')];

export function ThinkingBlob({ size = 34 }: { size?: number }) {
  const clock = useClock();
  const uniforms = useDerivedValue(() => ({
    u_resolution: [size, size],
    u_time: clock.value / 1000,
    u_color0: COLORS[0],
    u_color1: COLORS[1],
    u_color2: COLORS[2],
  }));

  if (!effect) return <View style={{ width: size, height: size }} />;

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader source={effect} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}

export default ThinkingBlob;
