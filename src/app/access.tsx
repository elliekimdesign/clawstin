import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { DevReset } from "@/components/dev/dev-reset";
import { maskToken } from "@/mock/infra";
import { GatewayStatus, useAppStore } from "@/store/app-store";
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "@/theme/theme";

const MONO = "Menlo";
// Lighter than the shared colors.cardAlt — this screen's white page needs a
// more subtle gray for its section blocks than the token used elsewhere.
const SECTION_BG = "#F8F9FA";
// Soft device-illustration tone: a gentle top-to-bottom gradient (not flat
// gray) for a touch of dimensionality, with a slightly richer stroke for
// definition at the larger size.
const DEVICE_FILL_TOP = "#F5F6F7";
const DEVICE_FILL_BOTTOM = "#E9EBEE";
const DEVICE_STROKE = "#BFC4CB";

// Mock — no live telemetry backend yet, matches the rest of this screen.
// Gateway isn't here — it's rendered separately below, driven by real state.
const SESSION_STATS: { label: string; value: string }[] = [
  { label: "CPU", value: "14%" },
  { label: "Latency", value: "12ms" },
];

/**
 * One connector dot that breathes light → dark → light. `delayMs` staggers
 * each dot so the darkening travels across the row like a quiet pulse,
 * peaking at the center — subtle, not a spinner.
 */
function ConnectorDot({ delayMs }: { delayMs: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0, { duration: 900 }),
        ),
        -1,
      ),
    );
  }, [t, delayMs]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [colors.border, colors.textTertiary]),
  }));
  return (
    <Animated.View
      style={[{ width: 4.5, height: 4.5, borderRadius: 2.25 }, style]}
    />
  );
}

/** Small elegant phone illustration with a top speaker notch, subtle gradient fill. */
function PhoneGlyph() {
  return (
    <Svg width={40} height={68} viewBox="0 0 40 68">
      <Defs>
        <LinearGradient id="phoneFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={DEVICE_FILL_TOP} />
          <Stop offset="1" stopColor={DEVICE_FILL_BOTTOM} />
        </LinearGradient>
      </Defs>
      <Rect
        x={1.75}
        y={1.75}
        width={36.5}
        height={64.5}
        rx={10}
        fill="url(#phoneFill)"
        stroke={DEVICE_STROKE}
        strokeWidth={1.3}
      />
      <Rect
        x={15.5}
        y={6.5}
        width={9}
        height={2.6}
        rx={1.3}
        fill={DEVICE_STROKE}
        opacity={0.85}
      />
    </Svg>
  );
}

/** Small elegant Mac-mini-style box with a seam line + status dot, subtle gradient fill. */
function MacMiniGlyph() {
  return (
    <Svg width={54} height={54} viewBox="0 0 54 54">
      <Defs>
        <LinearGradient id="miniFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={DEVICE_FILL_TOP} />
          <Stop offset="1" stopColor={DEVICE_FILL_BOTTOM} />
        </LinearGradient>
      </Defs>
      <Rect
        x={1.75}
        y={1.75}
        width={50.5}
        height={50.5}
        rx={8}
        fill="url(#miniFill)"
        stroke={DEVICE_STROKE}
        strokeWidth={1.3}
      />
      {/* front port-strip seam */}
      <Line
        x1={10}
        y1={40}
        x2={44}
        y2={40}
        stroke={DEVICE_STROKE}
        strokeWidth={1.2}
        opacity={0.85}
      />
      {/* subtle status dot */}
      <Circle cx={42} cy={11} r={1.8} fill={DEVICE_STROKE} opacity={0.9} />
    </Svg>
  );
}

const GATEWAY_STATUS_COPY: Record<GatewayStatus, { label: string; color: string }> = {
  online: { label: "Active", color: colors.success },
  unstable: { label: "Unstable", color: colors.warning },
  offline: { label: "Offline", color: colors.danger },
};

/**
 * Simple two-device network illustration: this phone talking to the local
 * Mac mini gateway. The INFRASTRUCTURE token list this replaced will return
 * later inside a dedicated Security section — data/routes are untouched,
 * just not shown here for now.
 */
function NetworkDiagram({
  gatewayStatus,
  onReconnect,
  onReboot,
}: {
  gatewayStatus: GatewayStatus;
  onReconnect: () => void;
  onReboot: () => void;
}) {
  const isTrouble = gatewayStatus !== "online";
  const troubleTint = gatewayStatus === "offline" ? colors.dangerSoft : colors.warningSoft;
  return (
    <View style={{ marginBottom: spacing.xxl, paddingVertical: spacing.md }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.lg,
        }}
      >
        <PhoneGlyph />
        {/* Dotted connector — each dot quietly breathes light→dark→light,
            staggered so the darkening peaks at the center dot and fades
            back out toward both ends. Subtle, not a spinner. */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ConnectorDot key={i} delayMs={Math.abs(i - 2.5) * 150} />
          ))}
        </View>
        <MacMiniGlyph />
      </View>

      {/* Eyebrow labels (CLIENT NODE / LOCAL GATEWAY) removed — device names
          alone now sit close under the device icons. This row mirrors the
          icon row's exact structure (same widths/gaps for phone, connector,
          Mac mini) so each name is truly centered under its own icon rather
          than centered in an even 50/50 split (the icons aren't the same
          width, so a plain space-between column pair drifted off-center). */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: spacing.lg,
          marginTop: spacing.sm,
        }}
      >
        {/* Fixed-width anchors keep the row's centering/gap math exactly as
            before; the actual label floats centered over its anchor via
            absolute position so long text overflows outward instead of
            clipping — nothing else in the layout shifts. */}
        <View style={{ width: 40 }}>
          <Text
            numberOfLines={1}
            style={{
              position: "absolute",
              left: -60,
              right: -60,
              textAlign: "center",
              color: colors.textSecondary,
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
            }}
          >
            iPhone 17 Pro
          </Text>
        </View>
        {/* spacer matching the connector's width so the gap math lines up */}
        <View style={{ width: 5 * 4.5 + 4 * 5 }} />
        <View style={{ width: 54 }}>
          <Text
            numberOfLines={1}
            style={{
              position: "absolute",
              left: -40,
              right: -40,
              textAlign: "center",
              color: colors.textSecondary,
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
            }}
          >
            Mac mini
          </Text>
        </View>
      </View>

      {/* Session stats — a THIRD row in the same quiet, unboxed language as
          the device-name row above (no card, no mono — keeps this whole
          area reading as one diagram, not diagram + data table). Extra
          marginTop keeps this row's position fixed even though the device
          names moved up closer to the icons above. Wrapped in a relative
          View so the trouble overlay below can absolutely-position over
          just this row, not the icons/labels above it. */}
      <View style={{ marginTop: spacing.lg + spacing.xl }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.lg,
          }}
        >
          {SESSION_STATS.map((s) => (
            <View key={s.label} style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: fontSize.caption,
                  fontFamily: fontFamily.semibold,
                  letterSpacing: 0.5,
                }}
              >
                {s.label.toUpperCase()}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: fontSize.small,
                  fontWeight: fontWeight.semibold,
                  marginTop: spacing.xs + 2,
                }}
              >
                {s.value}
              </Text>
            </View>
          ))}
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: fontSize.caption,
                fontFamily: fontFamily.semibold,
                letterSpacing: 0.5,
              }}
            >
              GATEWAY
            </Text>
            <Text
              style={{
                color: GATEWAY_STATUS_COPY[gatewayStatus].color,
                fontSize: fontSize.small,
                fontWeight: fontWeight.semibold,
                marginTop: spacing.xs + 2,
              }}
            >
              {GATEWAY_STATUS_COPY[gatewayStatus].label}
            </Text>
          </View>
        </View>

        {/* Light warning wash + Reconnect/Reboot, only when trouble */}
        {isTrouble ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              marginTop: spacing.md,
              backgroundColor: troubleTint,
              borderRadius: radius.lg,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              flexDirection: "row",
              justifyContent: "center",
              gap: spacing.sm,
            }}
          >
            <Pressable
              onPress={onReconnect}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 6,
                paddingHorizontal: spacing.md,
                borderRadius: radius.pill,
                backgroundColor: "#FFFFFF",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="refresh" size={13} color={colors.text} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.semibold,
                }}
              >
                Reconnect
              </Text>
            </Pressable>
            <Pressable
              onPress={onReboot}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 6,
                paddingHorizontal: spacing.md,
                borderRadius: radius.pill,
                backgroundColor: "#FFFFFF",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="settings-outline" size={13} color={colors.text} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize.caption,
                  fontWeight: fontWeight.semibold,
                }}
              >
                Reboot
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

/** Small pulsing dot for the "Syncing…" state (mirrors TypingIndicator's Dot). */
function PulseDot({ color }: { color: string }) {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 350 }),
        withTiming(0.3, { duration: 350 }),
      ),
      -1,
    );
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        { width: 7, height: 7, borderRadius: 999, backgroundColor: color },
        style,
      ]}
    />
  );
}

export default function AccessScreen() {
  const {
    permissions,
    infra,
    setInfraValue,
    copiedToast,
    syncingPermission,
    setConnected,
    gatewayStatus,
    reconnectGateway,
    rebootGateway,
  } = useAppStore();
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [expandedInfraId, setExpandedInfraId] = useState<string | null>(null);
  const [tokenDraft, setTokenDraft] = useState("");

  const connectedPermissions = permissions.filter(
    (p) => p.source === "connected",
  );
  const availablePermissions = permissions.filter(
    (p) => p.source === "available",
  );

  return (
    // Local white page — built manually (not the shared Screen component)
    // so the header bar is white too, not the shared gray page background.
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <View
        style={{
          height: 44,
          paddingHorizontal: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Pushed from Home's profile icon (no longer a tab) — needs a way back. */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ position: "absolute", left: spacing.lg }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSize.bodyLg,
            fontWeight: fontWeight.semibold,
          }}
        >
          Access
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Network diagram — this device talking to the local gateway.
            INFRASTRUCTURE's token list moves to a future Security section. */}
        <NetworkDiagram
          gatewayStatus={gatewayStatus}
          onReconnect={reconnectGateway}
          onReboot={rebootGateway}
        />

        {/* Group B — Tools: connected tools + one row summarizing what's
              still available on Web (mobile is a controller, not the OAuth surface).
              "Synced from Web" sits right next to the title (not far-right)
              with a small sync-arrows icon, so the sync-state read is close
              to what it's describing. Built locally rather than through the
              shared SectionHeader — its trailing prop is used elsewhere
              (crew/activity/memory) as a far-right count, a different layout. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 6,
            marginTop: spacing.lg,
            marginBottom: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: fontSize.small,
              fontWeight: fontWeight.semibold,
              letterSpacing: 0.3,
            }}
          >
            TOOLS
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="sync" size={11} color={colors.textTertiary} />
            <Text style={{ color: colors.textTertiary, fontSize: fontSize.small }}>
              Synced from Web
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: SECTION_BG,
            borderRadius: radius.lg,
            marginBottom: toolsExpanded ? 0 : copiedToast || syncingPermission ? 0 : spacing.xxl,
          }}
        >
          {connectedPermissions.map((p, i) => (
            <View
              key={p.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.divider,
              }}
            >
              <Ionicons name={p.icon} size={18} color={colors.textSecondary} />
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: fontSize.small,
                  fontWeight: fontWeight.semibold,
                }}
              >
                {p.name}
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: colors.success,
                  }}
                />
                <Text
                  style={{
                    color: colors.success,
                    fontSize: fontSize.caption,
                  }}
                >
                  Connected
                </Text>
              </View>
            </View>
          ))}

          {toolsExpanded
            ? availablePermissions.map((p) => (
                <Pressable
                  key={p.key}
                  onPress={() => {
                    if (p.setupUrl) Linking.openURL(p.setupUrl).catch(() => undefined);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderTopWidth: 1,
                    borderTopColor: colors.divider,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Ionicons name={p.icon} size={18} color={colors.textSecondary} />
                  <Text
                    style={{
                      flex: 1,
                      color: colors.text,
                      fontSize: fontSize.small,
                      fontWeight: fontWeight.semibold,
                    }}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              ))
            : null}

          {/* "More" toggle always sits LAST — after the expanded rows too —
              since it's the card's collapse control, not a mid-list item.
              Not connected yet is signaled by the absence of a status badge
              (Calendar/Contacts above DO show "Connected") rather than
              repeating a label per row. */}
          <Pressable
            onPress={() => setToolsExpanded((v) => !v)}
            disabled={!availablePermissions.length}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
              opacity: pressed ? 0.6 : !availablePermissions.length ? 0.5 : 1,
            })}
          >
            <Text
              style={{
                flex: 1,
                color: colors.text,
                fontSize: fontSize.small,
                fontWeight: fontWeight.semibold,
              }}
            >
              {toolsExpanded ? "Show less" : "More"}
            </Text>
            <Ionicons
              name={toolsExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textTertiary}
            />
          </Pressable>
        </View>

        {/* Quiet caption, sits on the gray page background just under the
            white card — not a banner inside it. Only shown expanded. Carries
            the card's usual bottom spacing now that the card's own
            marginBottom is zeroed out above. */}
        {toolsExpanded ? (
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: 11,
              fontWeight: fontWeight.regular,
              paddingHorizontal: spacing.lg,
              marginTop: spacing.xs,
              marginBottom: copiedToast || syncingPermission ? 0 : spacing.xxl,
            }}
          >
            Set these up on OpenClaw Web — changes sync back here automatically.
          </Text>
        ) : null}

        {/* Toast: still reachable via the store for a future live-sync trigger */}
        {copiedToast ? (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(180)}
            style={{
              marginTop: spacing.md,
              marginBottom: syncingPermission ? 0 : spacing.xxl,
              alignSelf: "center",
              backgroundColor: colors.cardAlt,
              borderRadius: radius.pill,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize.caption,
                fontFamily: fontFamily.semibold,
                letterSpacing: 0.2,
              }}
            >
              Link copied ↗ — paste it in your browser
            </Text>
          </Animated.View>
        ) : null}
        {syncingPermission ? (
          <View
            style={{
              marginTop: spacing.sm,
              marginBottom: spacing.xxl,
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <PulseDot color={colors.warning} />
            <Text
              style={{ color: colors.textTertiary, fontSize: fontSize.caption }}
            >
              Syncing…
            </Text>
          </View>
        ) : null}

        {/* Group C — System & Security: the two model tokens, minimal rows
            (name + quiet masked value, no icon/status/chevron) that expand
            an inline accordion on tap for pasting a new token — no separate
            screen anymore. + a static end-to-end-encryption row. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            marginTop: spacing.lg,
            marginBottom: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: fontSize.small,
              fontWeight: fontWeight.semibold,
              letterSpacing: 0.3,
            }}
          >
            SYSTEM & SECURITY
          </Text>
        </View>
        <View
          style={{
            backgroundColor: SECTION_BG,
            borderRadius: radius.lg,
            marginBottom: spacing.xxl,
          }}
        >
          {infra
            .filter((e) => e.kind === "token")
            .map((e, i) => {
              const isExpanded = expandedInfraId === e.id;
              return (
                <View key={e.id}>
                  <Pressable
                    onPress={() => {
                      setTokenDraft("");
                      setExpandedInfraId((id) => (id === e.id ? null : e.id));
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.divider,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        color: colors.text,
                        fontSize: fontSize.small,
                        fontWeight: fontWeight.semibold,
                      }}
                    >
                      {e.label.replace(" API Token", "").replace(" (Ollama)", "")}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.textTertiary,
                        fontSize: 11,
                        fontFamily: MONO,
                        letterSpacing: 0.2,
                      }}
                    >
                      {maskToken(e.value)}
                    </Text>
                  </Pressable>

                  {isExpanded ? (
                    <View
                      style={{
                        paddingHorizontal: spacing.lg,
                        paddingBottom: spacing.md,
                        borderTopWidth: 1,
                        borderTopColor: colors.divider,
                        gap: spacing.sm,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textTertiary,
                          fontSize: fontSize.caption,
                          fontWeight: fontWeight.semibold,
                          letterSpacing: 0.5,
                          marginTop: spacing.md,
                        }}
                      >
                        API TOKEN
                      </Text>
                      <TextInput
                        value={tokenDraft}
                        onChangeText={setTokenDraft}
                        placeholder="Paste new token"
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: radius.md,
                          padding: spacing.md,
                          fontFamily: MONO,
                          color: colors.text,
                          fontSize: fontSize.small,
                        }}
                      />
                      <Pressable
                        onPress={() => {
                          if (tokenDraft.trim()) setInfraValue(e.id, tokenDraft.trim());
                          setExpandedInfraId(null);
                        }}
                        style={({ pressed }) => ({
                          alignItems: "center",
                          paddingVertical: spacing.sm,
                          borderRadius: radius.md,
                          backgroundColor: colors.accent,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Text
                          style={{
                            color: colors.accentText,
                            fontWeight: fontWeight.semibold,
                            fontSize: fontSize.small,
                          }}
                        >
                          Save
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}

          {/* Static, read-only — not tappable, no chevron */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
            }}
          >
            <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
            <Text
              style={{
                flex: 1,
                color: colors.text,
                fontSize: fontSize.small,
                fontWeight: fontWeight.semibold,
              }}
            >
              Connection
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.small }}>
              End-to-End Encrypted
            </Text>
          </View>
        </View>

        {/* Disconnect — self-explanatory action, no section label needed */}
        <Pressable
          onPress={() => setConnected(false)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              paddingVertical: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.dangerSoft,
            }}
          >
            <Ionicons name="power" size={18} color={colors.danger} />
            <Text
              style={{
                color: colors.danger,
                fontSize: fontSize.body,
                fontWeight: fontWeight.semibold,
              }}
            >
              Disconnect agent
            </Text>
          </View>
        </Pressable>
      </ScrollView>
      <DevReset />
    </SafeAreaView>
  );
}
