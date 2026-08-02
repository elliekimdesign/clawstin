import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CrewPixel } from '@/components/ui/crew-pixel';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { MachinePixel } from '@/components/ui/machine-pixel';
import { MosaicCheck } from '@/components/ui/mosaic-check';
import { initialCrew } from '@/mock/crew';
import { initialPermissions } from '@/mock/permissions';
import { fontFamily, fontSize, spacing, sysColor } from '@/theme/theme';

/**
 * PAIRING, the product's one real onboarding moment (2026-07-30).
 *
 * Clawstin does not make an account — it connects to YOUR machine. That is
 * the line between this and every other AI app, so the first run teaches it
 * in three beats instead of asking for an email:
 *
 *   1 · SCAN     the gateway address, or the QR the terminal prints
 *   2 · HANDSHAKE  this device ↔ the local node, the link resolving to a
 *                   real host. Both sides are named by ROLE, never by
 *                   product: the node may be a mini, a laptop, a NAS, a
 *                   rented box. The app cannot know, so it does not claim to.
 *   3 · CREW WAKES  the roster is READ FROM THE SERVER, teaching that the
 *                   crew lives on your machine and not inside the app
 *
 * No login screen exists anywhere in the product. In a self-hosted tool,
 * "no account, your server is your account" is the positioning statement.
 */

const INK = '#16181C';
const DIM = 'rgba(22,24,28,0.55)';
const FAINT = 'rgba(22,24,28,0.38)';

export type PairingStep = 'scan' | 'handshake' | 'crew';

/** the dots' fixed distance from the top of the pairing area. Tuned so the
 * bar lands where step 1 already had it, and the other two steps come to it
 * rather than the other way round. */
const DOTS_TOP = 176;

/** the host the demo resolves to — shown the moment the link lands */
const HOST = 'openclaw.local:8443';
const PING = '12ms';

/** THIS SIDE IS REAL (2026-07-30): expo-device reports the actual hardware,
 * so the line under THIS DEVICE is true on a real phone. It is null on web
 * and can be null in a simulator, which is why every consumer treats the
 * detected name as optional rather than assuming a string. */
const THIS_DEVICE_MODEL: string | null = Device.modelName;

/** THIS SIDE IS STILL A MOCK. The gateway does not yet report what it is
 * running on, so there is nothing truthful to show here. The placeholder
 * lets the two-line design be judged now.
 *
 * TODO(server): have the handshake return the node's own identity (hostname
 * / OS / model) and replace this constant with that field. Until then this
 * MUST NOT be presented to a real user as detected fact. */
const NODE_MODEL_MOCK = 'TrueNAS';

/** how long after the link resolves the hardware names fade in. Detection
 * has to read as a second event, so it lands after the link, not with it. */
const DETECT_DELAY_MS = 620;

/* ─────────────────────────── shared pieces ─────────────────────────── */

/** the dotted line between the two machines, travelling while it connects */
function LinkDots({ live }: { live: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!live) {
      t.value = 1;
      return;
    }
    t.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [live, t]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: 7 }, (_, i) => (
        <Dot key={i} i={i} t={t} live={live} />
      ))}
    </View>
  );
}

function Dot({ i, t, live }: { i: number; t: { value: number }; live: boolean }) {
  const style = useAnimatedStyle(() => {
    if (!live) return { opacity: 0.9 };
    // a soft pulse travelling left to right
    const phase = (t.value * 7 - i + 7) % 7;
    return { opacity: 0.25 + 0.75 * Math.max(0, 1 - phase) };
  });
  return (
    <Animated.View
      style={[
        { width: 5, height: 5, borderRadius: 999, backgroundColor: sysColor.accent },
        style,
      ]}
    />
  );
}

/** one machine in the handshake, drawn in the app's own pixel language
 * (2026-07-30): no card, no icon set — the same grid the crew faces use.
 *
 * TWO LINES, AND THE SECOND ONE ARRIVES (2026-07-30 "지금 너무 컨셉 같아서"):
 * the role alone read as a diagram label rather than as a live machine.
 * The role stays on top — it is the honest, always-true name — and the
 * hardware it resolves to fades in underneath a beat later, so the screen
 * performs DETECTION instead of asserting a preset. If nothing resolves,
 * the second line simply never appears and the role still stands alone.
 *
 * The reserved height means the late line cannot nudge the icons.
 */
function Machine({
  label,
  shape,
  detected,
}: {
  label: string;
  shape: 'phone' | 'mini';
  /** the real hardware, once known — null keeps the row to its role only */
  detected: string | null;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <MachinePixel shape={shape} size={72} />
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: fontFamily.mono,
            fontSize: 11,
            letterSpacing: 0.3,
            color: DIM,
          }}>
          {label}
        </Text>
        {/* the slot is always held open, so the icons never jump when the
            detected name lands */}
        <View style={{ height: 15, justifyContent: 'center' }}>
          {detected ? (
            <Animated.Text
              entering={FadeIn.duration(420)}
              numberOfLines={1}
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 9.5,
                letterSpacing: 0.2,
                color: FAINT,
              }}>
              {detected}
            </Animated.Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** three dots instead of "STEP 1 OF 3" (2026-07-30): the count is a shape,
 * not a sentence, so it stops competing with the headline for reading. */
function StepDots({ index }: { index: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: i === index ? 18 : 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: i === index ? sysColor.accent : 'rgba(22,24,28,0.16)',
          }}
        />
      ))}
    </View>
  );
}

/* ───────────────────────────── the flow ───────────────────────────── */

export function PairingFlow({
  step,
  onStep,
  onDone,
}: {
  step: PairingStep;
  onStep: (s: PairingStep) => void;
  /** pairing finished: the board takes over */
  onDone: () => void;
}) {
  const [address, setAddress] = useState('');
  /** handshake resolves after a beat, so the host lands as a moment */
  const [linked, setLinked] = useState(false);
  /** and the hardware names resolve after THAT, as a second beat */
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    if (step !== 'handshake') {
      setLinked(false);
      setDetected(false);
      return;
    }
    const link = setTimeout(() => setLinked(true), 1800);
    // staged, not simultaneous: link first, then what each side turned out
    // to be. Both timers are cleared together so leaving mid-handshake
    // cannot land a late setState on an unmounted step.
    const detect = setTimeout(() => setDetected(true), 1800 + DETECT_DELAY_MS);
    return () => {
      clearTimeout(link);
      clearTimeout(detect);
    };
  }, [step]);

  const crew = initialCrew.slice(0, 4);
  const tools = initialPermissions.filter((p) => p.source === 'connected');

  return (
    <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: DOTS_TOP + 34 }}>
      {/* THE DOTS DO NOT MOVE (2026-07-30 "쟨 저기로 고정해야하는거야"): they
          used to live inside each step's own block, so they drifted up and
          down as the content height changed. Anchored to the screen, they
          read as one progress bar the steps pass through. */}
      <View style={{ position: 'absolute', left: 28, top: DOTS_TOP }}>
        <StepDots index={step === 'scan' ? 0 : step === 'handshake' ? 1 : 2} />
      </View>
      {/* ── 1 · SCAN ─────────────────────────────────────────────── */}
      {step === 'scan' ? (
        <Animated.View entering={FadeIn.duration(320)} exiting={FadeOut.duration(160)}>
          <Text
            style={{
              fontFamily: 'InstrumentSerif-Regular',
              fontSize: 36,
              lineHeight: 42,
              color: INK,
            }}>
            Connect to your machine
          </Text>
          {/* ONE short line (2026-07-30 "글이 좀 많아서"): the long version
              explained the whole architecture up front. The promise lands
              harder in a sentence you can read at a glance. */}
          <Text
            style={{
              marginTop: 10,
              fontSize: fontSize.body,
              lineHeight: 22,
              fontFamily: fontFamily.regular,
              color: DIM,
            }}>
            No account. Clawstin runs on hardware you own.
          </Text>

          {/* ONE card holds both ways in (2026-07-30): the address and the
              QR line were two loose rows on the fan. Grouped, they read as
              a single "how you connect" block with a divider between the
              two options.
              FOLDER, not a plain card (2026-07-30 "온보딩에도 우리 폴더
              스타일을 살짝"): the first surface the user ever touches wears
              the board's folder grammar — white face, GATEWAY flap, the
              ghost-blue layer showing at the notch — so the board reads as
              the same product when it takes over. */}
          <View
            style={{
              marginTop: 26,
              shadowColor: '#16181C',
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}>
            <FrostedGlassFill
              radius={16}
              tabWidth={100}
              tabHeight={22}
              tint="rgba(255,255,255,0.92)"
            />
            <View style={{ height: 26, justifyContent: 'center', paddingHorizontal: 16 }}>
              <Text
                style={{
                  fontFamily: fontFamily.mono,
                  fontSize: 11,
                  letterSpacing: 0.3,
                  color: DIM,
                }}>
                GATEWAY
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              <Ionicons name="link-outline" size={16} color={FAINT} />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder={HOST}
                placeholderTextColor={FAINT}
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  marginLeft: 10,
                  paddingVertical: 15,
                  fontSize: fontSize.body,
                  fontFamily: fontFamily.mono,
                  color: INK,
                }}
              />
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(22,24,28,0.07)' }} />

            {/* the QR path: the terminal prints one on boot, which is a
                familiar and welcome grammar for anyone who self-hosts */}
            <Pressable
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
                opacity: pressed ? 0.6 : 1,
              })}>
              <Ionicons name="qr-code-outline" size={16} color={DIM} />
              <Text style={{ fontSize: fontSize.small, color: DIM, flex: 1 }}>
                Scan the QR from your terminal
              </Text>
              <Ionicons name="chevron-forward" size={13} color={FAINT} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => onStep('handshake')}
            style={({ pressed }) => ({
              marginTop: 30,
              paddingVertical: 15,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: sysColor.accent,
              opacity: pressed ? 0.85 : 1,
            })}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: fontSize.body,
                fontFamily: fontFamily.semibold,
              }}>
              Connect
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* ── 2 · HANDSHAKE ────────────────────────────────────────── */}
      {step === 'handshake' ? (
        <Animated.View
          entering={FadeIn.duration(320)}
          exiting={FadeOut.duration(160)}
          // centred across, top-anchored down: the machines line up with
          // where the other two steps put their headline (2026-07-30)
          style={{ alignItems: 'center', marginTop: 8 }}>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            {/* NO BRAND NAMES (2026-07-30 "맥 미니건 뭐건 서버건 그냥 일반적인
                기능이여야하지"): the app has never seen the user's hardware
                when this screen draws, so naming it IPHONE ↔ MAC MINI was a
                guess presented as a fact. The pair is stated by ROLE instead:
                the thing in your hand, and the machine it runs on, whatever
                that machine happens to be. */}
            <Machine
              label="THIS DEVICE"
              shape="phone"
              detected={detected ? THIS_DEVICE_MODEL : null}
            />
            <LinkDots live={!linked} />
            <Machine
              label="LOCAL NODE"
              shape="mini"
              detected={detected ? NODE_MODEL_MOCK : null}
            />
          </View>

          {/* minHeight, not a fixed 74: the receipt card is taller than the
              "reaching…" line it replaces, and a hard height clipped it.
              The floor still reserves the space so the machines do not jump
              when the link resolves. */}
          <View style={{ minHeight: 74, alignSelf: 'stretch', justifyContent: 'center' }}>
            {linked ? (
              // THE RECEIPT, as a card (2026-07-30 "looks unfinished"): the
              // host, the ping and the encryption line were three loose
              // rows floating on the field. Wrapped in the same white card
              // step 1 uses for its input, they read as one resolved fact.
              <Animated.View
                entering={FadeInDown.duration(320)}
                // AN ACTIVATED FOLDER, NOT ANOTHER INPUT (2026-07-30 "연결이
                // 되고 난 후니까 활성화된 폴더 스타일"): step 1 asks inside a
                // still white GATEWAY folder; this one is the machine
                // reporting back, so it wears the SAME folder grammar but
                // switched on — bluer veil, LINKED flap in accent, and the
                // board's `shine` breath (RUNNING's alive state), so
                // "connected" reads as the folder waking up.
                //
                // STILL BLUE, NOT GREEN (2026-07-30 "초록색 라인 너무 밤티"):
                // the earlier green edge fought the fill; the activated cues
                // stay in the accent family instead.
                style={{
                  marginTop: 22,
                  alignSelf: 'stretch',
                  shadowColor: '#16181C',
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 4,
                }}>
                <FrostedGlassFill
                  radius={14}
                  tabWidth={82}
                  tabHeight={20}
                  tint="rgba(186,216,242,0.60)"
                  shine
                />
                <View style={{ height: 24, justifyContent: 'center', paddingHorizontal: 16 }}>
                  <Text
                    style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 11,
                      letterSpacing: 0.3,
                      color: sysColor.accent,
                    }}>
                    LINKED
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 13 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* NO MARK ON THE HOST (2026-07-30): a check says "verified",
                      but this row says WHERE you landed, and the card only
                      exists once the link resolved — so the tick restated
                      something the card already proves. The address alone,
                      in mono, is the more confident line. */}
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: fontFamily.mono,
                      fontSize: 13,
                      color: INK,
                    }}>
                    {HOST}
                  </Text>
                  {/* the ping sits in its own quiet chip, so the row reads
                      host / latency instead of one run-on string */}
                  <View
                    style={{
                      paddingHorizontal: 7,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: 'rgba(22,24,28,0.05)',
                    }}>
                    <Text
                      style={{ fontFamily: fontFamily.mono, fontSize: 11, color: DIM }}>
                      {PING}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    height: 1,
                    marginVertical: 11,
                    backgroundColor: 'rgba(22,24,28,0.10)',
                  }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="lock-closed" size={12} color={FAINT} />
                  <Text style={{ fontSize: fontSize.small, color: DIM, flex: 1 }}>
                    End to end encrypted on your own network
                  </Text>
                </View>
                </View>
              </Animated.View>
            ) : (
              <Text
                style={{
                  marginTop: 22,
                  fontFamily: fontFamily.mono,
                  fontSize: 12,
                  color: DIM,
                }}>
                reaching the gateway…
              </Text>
            )}
          </View>

          {linked ? (
            <Animated.View entering={FadeIn.duration(260)} style={{ width: '100%' }}>
              <Pressable
                onPress={() => onStep('crew')}
                style={({ pressed }) => ({
                  marginTop: 18,
                  paddingVertical: 15,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: sysColor.accent,
                  opacity: pressed ? 0.85 : 1,
                })}>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: fontSize.body,
                    fontFamily: fontFamily.semibold,
                  }}>
                  Continue
                </Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : null}

      {/* ── 3 · CREW WAKES UP ────────────────────────────────────── */}
      {step === 'crew' ? (
        <Animated.View entering={FadeIn.duration(320)}>
          <Text
            style={{
              fontFamily: 'InstrumentSerif-Regular',
              fontSize: 36,
              lineHeight: 42,
              color: INK,
            }}>
            Your crew woke up
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: fontSize.body,
              lineHeight: 22,
              fontFamily: fontFamily.regular,
              color: DIM,
            }}>
            They live on your machine, not in this app.
          </Text>

          {/* the roster, READ FROM THE SERVER — each face lands in turn.
              ONE LEFT EDGE (2026-07-30 "글씨가 시작하는 지점이 일자로 좀
              맞아야할거같아"): the name used to size to its own content, so
              "Beanie" pushed its description further right than "Wink" did
              and the column zig-zagged. The name now sits in a fixed 62px
              column — the same trick crew.tsx:266 uses — so every line of
              text below starts on one vertical rule. */}
          <View style={{ marginTop: 26, gap: 22 }}>
            {crew.map((c, i) => (
              <Animated.View
                key={c.id}
                entering={FadeInDown.duration(300).delay(140 * i)}
                // flex-start, not center: the rows are two lines tall now
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    backgroundColor: '#F5F6F4',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <CrewPixel id={c.id} size={24} />
                </View>
                {/* the NAME steps back now that the role is a dark heading
                    (2026-07-30): identical weight on both would have set two
                    headings side by side, competing. The nickname stays
                    readable but yields to the role, which is the fact this
                    screen is actually teaching. */}
                <Text
                  numberOfLines={1}
                  style={{
                    width: 62,
                    // optical: sit the name on the role word's baseline
                    marginTop: 1,
                    fontSize: fontSize.body,
                    fontFamily: fontFamily.regular,
                    color: DIM,
                  }}>
                  {c.name}
                </Text>
                {/* TITLE AND SUBTITLE (2026-07-30 "더 잘 읽혀야할거같아"):
                    the first pass set the role in small grey uppercase, the
                    same weight and colour as the sentence under it — so the
                    role did not lead, it just looked like smaller version of
                    the same text. Now they hold different RANKS: the role is
                    dark and normal-case like a heading, the sentence is
                    smaller and grey beneath it. Case and colour do the work
                    together instead of fighting each other. */}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={{
                      fontSize: fontSize.body,
                      fontFamily: fontFamily.medium,
                      color: INK,
                    }}>
                    {c.roleWord}
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.small,
                      lineHeight: 18,
                      fontFamily: fontFamily.regular,
                      color: DIM,
                    }}>
                    {c.roleLine}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(140 * crew.length)}
            style={{
              marginTop: 22,
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}>
            <MosaicCheck color={sysColor.ready} size={10} />
            <Text style={{ fontSize: fontSize.small, color: DIM }}>
              {`${tools.map((t) => t.name).join(', ')} connected`}
            </Text>
          </Animated.View>

          <Pressable
            onPress={onDone}
            style={({ pressed }) => ({
              marginTop: 30,
              paddingVertical: 15,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: sysColor.accent,
              opacity: pressed ? 0.85 : 1,
            })}>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: fontSize.body,
                fontFamily: fontFamily.semibold,
              }}>
              Start working
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default PairingFlow;
