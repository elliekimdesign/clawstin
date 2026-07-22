import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ColorPanelsBg } from '@/components/ui/color-panels-bg';
import { KeySheen, keyChrome } from '@/components/ui/analog-key';
import { FrostedGlassFill } from '@/components/ui/frosted-glass-fill';
import { MosaicDot } from '@/components/ui/mosaic-dot';
import { CREW_ACCENT, CrewPixel } from '@/components/ui/crew-pixel';
import { CrewSheet } from '@/components/ui/crew-sheet';
import { PixelText } from '@/components/ui/pixel-text';
import type { ActivityItem } from '@/mock/activity';
import type { CrewMember } from '@/mock/crew';
import { useAppStore } from '@/store/app-store';
import { brandBlue, fontFamily, fontSize, radius, spacing, sysColor } from '@/theme/theme';

// daylight tones: the Crew tab shares the acidglass home field, and the
// cards go WHITE — characters as transparent cutouts on paper. Dark
// olive ink on light surface.
const CARD = '#F5F6F4'; // off-white: softens the ink-on-white contrast

// the app's shared glass recipe (ask bar, section windows): liquid lens
// under a translucent white veil, white hairline on the container
const GLASS_AVAILABLE = Platform.OS === 'ios' && isGlassEffectAPIAvailable();
function CardGlass() {
  return (
    <>
      {GLASS_AVAILABLE ? (
        <GlassView
          glassEffectStyle="clear"
          colorScheme="light"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View
        pointerEvents="none"
        // 0.62 → 0.74 (2026-07-16): tracks the Home windows' veil so
        // the crew cards sit at the same brightness as the board
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.74)' }]}
      />
    </>
  );
}

const INK = '#16181C';
const INK_DIM = 'rgba(22,24,28,0.6)';
const INK_SOFT = 'rgba(22,24,28,0.06)';
const INK_EDGE = 'rgba(22,24,28,0.14)';
const NAME_GHOST = 'rgba(22,24,28,0.07)';

/** One crew badge (Finn anatomy): circular avatar chip straddling the
 * top edge, real centered name (no ghost watermark), the member's
 * accessory color as a small underline, mono role, and ONE footer
 * fact line. The card identifies; the detail screen explains. */
/** the sections' fitted-flap measure, shared by every folder card on
 * this screen (same pattern as Home's flapW) */
function useFlapW(fallback: number, pad = 14, gap = 16) {
  const [w, setW] = useState(0);
  const onTitleLayout = (e: { nativeEvent: { lines: { width: number }[] } }) => {
    const m = Math.ceil(e.nativeEvent.lines[0]?.width ?? 0);
    if (m !== w) setW(m);
  };
  return [w ? pad + w + gap : fallback, onTitleLayout] as const;
}

/** The crew badge as a FROSTED FOLDER (2026-07-17 "홈탭 스타일" +
 * "카드 사이즈 크게"): the member's ROLE rides the flap, the body got
 * air — a bigger face, the bitmap name with the member's mosaic
 * accent, runs in the machine voice pinned bottom-left like Home's
 * "1 routines" door. */
function CrewBadge({
  member,
  width,
  onPress,
}: {
  member: CrewMember;
  width: number;
  /** opens the member's HR-file sheet (2026-07-20) — the old
      full-screen /crew/[id] push retired with it */
  onPress: () => void;
}) {
  const roleTag = member.role.split(' · ')[0];
  return (
    <View style={{ width }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          // taller than the old 150: the identity sentence needs room
          height: 184,
          shadowColor: '#16181C',
          shadowOpacity: 0.1,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
          opacity: pressed ? 0.85 : 1,
        })}>
        {/* shape swap (2026-07-21 reference: one soft continuous
            radius, no flap): the roster drops the folder silhouette but
            keeps the exact glass — same veil, sheen, grain, rim */}
        <FrostedGlassFill radius={22} flat />
        <View style={{ paddingTop: 14, paddingHorizontal: 14 }}>
          <Text
            style={{
              alignSelf: 'flex-end',
              fontSize: 12,
              fontFamily: fontFamily.mono,
              letterSpacing: 0.3,
              color: 'rgba(22,24,28,0.55)',
            }}>
            {roleTag}
          </Text>
        </View>
        {/* SYSTEM ROW, scaled up: face left, name right */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingHorizontal: 14,
            marginTop: 8,
          }}>
          <CrewPixel id={member.id} size={44} />
          <PixelText text={member.name.toUpperCase()} cell={1.6} color={INK} led />
        </View>
        {/* identity sentence (2026-07-20, Info = 정체성): WHO this
            member is replaces the active pill; run stats live in Perf */}
        <Text
          style={{
            paddingHorizontal: 14,
            marginTop: 8,
            fontSize: 11,
            lineHeight: 15,
            color: INK_DIM,
          }}>
          {member.desc}
        </Text>
        {/* bottom-left meta door, Home's "1 routines" slot: recency,
            not totals (the count moved to Perf's ledger) */}
        <View style={{ position: 'absolute', left: 14, bottom: 12 }}>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
            {`last run ${member.lastRun}`}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

/** One chart card comparing the whole crew: a vertical bar per agent
 * (height = share of the busiest agent's completed tasks) with the
 * agent's round face chip sitting on top of their bar. */
function ContributionCard({ crew }: { crew: CrewMember[] }) {
  const [flapW, onTitleLayout] = useFlapW(120, 18, 18);
  return (
    <View
      style={{
        // frosted folder (2026-07-17 "홈탭 스타일")
        shadowColor: '#16181C',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
      }}>
      <FrostedGlassFill radius={16} tabWidth={flapW} />
      <View
        style={{
          height: 26,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
        }}>
        <Text
          onTextLayout={onTitleLayout}
          style={{
            fontSize: 12,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.3,
            color: 'rgba(22,24,28,0.55)',
          }}>
          Action runs
        </Text>
        <Text style={{ color: 'rgba(22,24,28,0.45)', fontSize: 10 }}>
          tasks, last 7 days
        </Text>
      </View>
      {/* DAY HEATMAP rows (2026-07-16 — the share-of-max gauge implied
          a scale that doesn't exist, "어디가 100?"): 7 cells = the 7
          days the strip claims, shade = that day's volume (GitHub
          contribution-graph grammar), total in the machine voice */}
      {/* day axis: the actual last 7 days, so the cells read as a
          calendar and not an abstract gauge (2026-07-16 GitHub ref) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          marginTop: 8,
        }}>
        <View style={{ width: 132 }} />
        <View style={{ flexDirection: 'row', gap: 3, flex: 1 }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(Date.now() - (6 - i) * 86400000);
            return (
              <Text
                key={i}
                style={{
                  width: 11,
                  textAlign: 'center',
                  fontSize: 8,
                  fontFamily: fontFamily.mono,
                  color: 'rgba(22,24,28,0.4)',
                }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()]}
              </Text>
            );
          })}
        </View>
        <View style={{ width: 30 }} />
      </View>
      <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 8, gap: 13 }}>
        {(() => {
          const daily = crew.map((m, idx) => {
            const w = DAY_WEIGHTS[idx % DAY_WEIGHTS.length];
            const sum = w.reduce((a, b) => a + b, 0);
            return w.map((x) => Math.round((m.tasksDone * x) / sum));
          });
          const peak = Math.max(1, ...daily.flat());
          return crew.map((m, idx) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CrewPixel id={m.id} size={20} />
              <Text
                numberOfLines={1}
                style={{
                  width: 92,
                  fontSize: 10,
                  fontFamily: fontFamily.mono,
                  letterSpacing: 0.3,
                  color: INK_DIM,
                }}>
                {m.role.split(' · ')[0]}
              </Text>
              <View style={{ flexDirection: 'row', gap: 3, flex: 1 }}>
                {daily[idx].map((v, i) => {
                  const level = v === 0 ? 0 : Math.ceil((v / peak) * 4);
                  return (
                    <View
                      key={i}
                      style={{
                        width: 11,
                        height: 11,
                        backgroundColor:
                          level === 0 ? 'rgba(22,24,28,0.06)' : (CREW_ACCENT[m.id] ?? '#8FBFF2'),
                        opacity: level === 0 ? 1 : [0, 0.3, 0.5, 0.75, 1][level],
                      }}
                    />
                  );
                })}
              </View>
              <Text
                style={{
                  width: 30,
                  textAlign: 'right',
                  fontSize: 10,
                  fontFamily: fontFamily.mono,
                  color: INK_DIM,
                }}>
                {m.tasksDone}
              </Text>
            </View>
          ));
        })()}
      </View>
      {/* intensity legend, GitHub's own words */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 3,
          paddingHorizontal: 18,
          paddingBottom: 14,
        }}>
        <Text style={{ fontSize: 9, fontFamily: fontFamily.mono, color: 'rgba(22,24,28,0.4)' }}>
          less
        </Text>
        {[0.06, 0.18, 0.32, 0.5, 0.72].map((a, i) => (
          <View key={i} style={{ width: 8, height: 8, backgroundColor: `rgba(22,24,28,${a})` }} />
        ))}
        <Text style={{ fontSize: 9, fontFamily: fontFamily.mono, color: 'rgba(22,24,28,0.4)' }}>
          more
        </Text>
      </View>
    </View>
  );
}

// deterministic mock day-shapes (no live per-day data yet): each
// member gets a different weekly rhythm, rotated by roster index
const DAY_WEIGHTS = [
  [2, 4, 1, 5, 3, 6, 4],
  [5, 2, 6, 3, 1, 4, 2],
  [1, 3, 0, 2, 4, 2, 3],
  [3, 1, 4, 0, 5, 1, 3],
];

/** One bento stat tile in the Perf view (home-tab tile energy, smaller). */
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 0,
        backgroundColor: 'rgba(22,24,28,0.05)',
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}>
      <Text
        style={{
          color: INK_DIM,
          fontSize: 9,
          fontFamily: fontFamily.semibold,
          letterSpacing: 0.8,
        }}>
        {label}
      </Text>
      <Text
        style={{
          color: INK,
          fontSize: 17,
          fontFamily: fontFamily.semibold,
          marginTop: 2,
        }}>
        {value}
      </Text>
    </View>
  );
}

/** Perf view section for one agent: one white card (same shell as the
 * profile cards) with the agent's round face chip in front of the role
 * pill, and a bento stat row inside. */
function PerfSection({ member, recent }: { member: CrewMember; recent: ActivityItem[] }) {
  const roleTag = member.role.split(' · ')[0];
  const [perfFlapW, onPerfTitleLayout] = useFlapW(110, 18, 18);
  return (
    <Pressable
      onPress={() => router.push(`/crew/history/${member.id}`)}
      style={({ pressed }) => ({
        // frosted folder, like the Info roster cards (2026-07-17)
        shadowColor: '#16181C',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
        opacity: pressed ? 0.9 : 1,
      })}>
      <FrostedGlassFill radius={16} tabWidth={perfFlapW} />
      {/* strip carries the ROLE, same as the Info cards */}
      <View style={{ height: 26, justifyContent: 'center', paddingHorizontal: 18 }}>
        <Text
          onTextLayout={onPerfTitleLayout}
          style={{
            alignSelf: 'flex-start',
            fontSize: 12,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.3,
            color: 'rgba(22,24,28,0.55)',
          }}>
          {roleTag}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 }}>
      {/* header in the roster cards' system-row anatomy: bare face,
          bitmap name, mosaic accent */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CrewPixel id={member.id} size={30} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <PixelText text={member.name.toUpperCase()} cell={1.4} color={INK} led />
          <MosaicDot color={CREW_ACCENT[member.id] ?? INK_DIM} size={8} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <StatTile label="AUTONOMY" value={`${member.autonomy}%`} />
        <StatTile label="TIME SAVED" value={`${member.timeSavedH}h`} />
        <StatTile label="TOKENS" value={`${member.tokensM}M`} />
      </View>

      {/* the actual user prompts this agent handled, newest first --
          seeing who handled what nudges the user toward Add crew */}
      <View style={{ marginTop: 16, paddingHorizontal: 2 }}>
        <Text
          style={{
            color: INK_DIM,
            fontSize: 9,
            fontFamily: fontFamily.semibold,
            letterSpacing: 0.8,
            marginBottom: 10,
          }}>
          RECENT PROMPTS
        </Text>
        {recent.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => router.push(`/chat/${entry.threadId}`)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 9,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Text style={{ color: 'rgba(22,24,28,0.35)', fontSize: 12 }}>
              {'\u21b3'}
            </Text>
            <Text
              numberOfLines={1}
              style={{ flex: 1, color: 'rgba(22,24,28,0.8)', fontSize: 12 }}>
              {entry.prompt}
            </Text>
            <Text style={{ color: 'rgba(22,24,28,0.45)', fontSize: 12 }}>
              {entry.ago}
            </Text>
          </Pressable>
        ))}
      </View>
      </View>
    </Pressable>
  );
}

/** Info | Perf segmented toggle in the header. */
function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'info' | 'perf';
  onChange: (m: 'info' | 'perf') => void;
}) {
  return (
    // analog key shell (2026-07-16): the segmented toggle sits on the
    // same beveled keycap material as the Home status bar / >_ lens
    <View style={[keyChrome(false), { flexDirection: 'row', padding: 3 }]}>
      <KeySheen />
      {(['info', 'perf'] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          style={{
            paddingVertical: 5,
            paddingHorizontal: 16,
            borderRadius: 0,
            backgroundColor: mode === m ? '#FFFFFF' : 'transparent',
            shadowColor: '#26301F',
            shadowOpacity: mode === m ? 0.12 : 0,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}>
          <Text
            style={{
              color: mode === m ? INK : INK_DIM,
              fontSize: 12,
              fontFamily: fontFamily.semibold,
            }}>
            {m === 'info' ? 'Info' : 'Perf'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** The hired crew — assistant characters with pro skills. */
export default function CrewScreen() {
  const { crew, activity } = useAppStore();
  const [mode, setMode] = useState<'info' | 'perf'>('info');
  // the HR-file sheet: id and open flag split on purpose — closing only
  // flips the flag, so the member stays rendered through the slide-out
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { width: screenW } = useWindowDimensions();
  // two-column roster: screen padding both sides + one 12pt gutter
  const badgeW = (screenW - spacing.lg * 2 - 12) / 2;

  const switchMode = (m: 'info' | 'perf') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(m);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4E83B8' }} edges={['top']}>
      <StatusBar style="light" />
      <ColorPanelsBg />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}>
        {/* Header: big title left, count right */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            // header row sits at the SAME spot on every tab: screen
            // padding (14) + 4 = Home's 18 below the safe area
            marginTop: 4,
            // and the board's airy 28pt rhythm below it, like Home's
            // first section and Activity's search
            marginBottom: spacing.xxl,
          }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 20,
              letterSpacing: -0.3,
              fontFamily: fontFamily.bold,
            }}>
            Crew
          </Text>
          <ModeToggle mode={mode} onChange={switchMode} />
        </View>

        {mode === 'info' ? (
          // the roster: profile badges in two columns; tap = detail.
          // Board rhythm: 12pt column gutter, the Home sections' 28pt
          // air between rows (2026-07-16 "홈탭 섹션 간격처럼")
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 28 }}>
            {crew.map((m) => (
              <CrewBadge
                key={m.id}
                member={m}
                width={badgeW}
                onPress={() => {
                  setSheetId(m.id);
                  setSheetOpen(true);
                }}
              />
            ))}
            {/* the empty slot: a GHOST crew card — the next member's
                badge already on the roster, translucent, with an empty
                avatar seat (dashed default-y box rejected: "i dont like
                this standard style"). Anatomy mirrors CrewBadge 1:1. */}
            <Pressable
              onPress={() =>
                Alert.alert('Coming soon', 'Hiring new crew members is on the way.')
              }
              style={({ pressed }) => ({
                width: badgeW,
                // tracks CrewBadge's height so the ghost stays a sibling
                height: 184,
                opacity: pressed ? 0.6 : 1,
              })}>
              {/* the empty slot is a GHOST card: the same soft-radius
                  plate as its siblings but the front veil goes
                  see-through — a seat waiting for a member */}
              <FrostedGlassFill radius={22} flat tint="rgba(255,255,255,0.28)" />
              <View style={{ paddingTop: 14, paddingHorizontal: 14 }}>
                <Text
                  style={{
                    alignSelf: 'flex-end',
                    fontSize: 12,
                    fontFamily: fontFamily.mono,
                    letterSpacing: 0.3,
                    color: 'rgba(22,24,28,0.55)',
                  }}>
                  Open slot
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingHorizontal: 14,
                  marginBottom: 10,
                }}>
                {/* the empty seat: a bare + where the face would sit */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="add" size={28} color="rgba(22,24,28,0.5)" />
                </View>
                <View style={{ gap: 8 }}>
                  <PixelText text="ADD CREW" cell={1.6} color={INK_DIM} led />
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
                    tap to hire
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <ContributionCard crew={crew} />
            {crew.map((m) => (
              <PerfSection
                key={m.id}
                member={m}
                recent={activity.filter((a) => a.agentId === m.id).slice(0, 3)}
              />
            ))}
          </View>
        )}

        {/* Add crew — MVP placeholder (Info mode carries the full-size
            dashed slot inside the fan instead) */}
        {mode === 'info' ? null : (
        <Pressable
          onPress={() => Alert.alert('Coming soon', 'Hiring new crew members is on the way.')}
          style={({ pressed }) => ({
            marginTop: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.lg,
            borderRadius: 0,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: 'rgba(255,255,255,0.6)',
            backgroundColor: 'rgba(255,255,255,0.08)',
            opacity: pressed ? 0.6 : 1,
          })}>
          <Ionicons name="add" size={18} color="rgba(255,255,255,0.85)" />
          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: fontSize.body,
              fontFamily: fontFamily.semibold,
            }}>
            Add crew
          </Text>
        </Pressable>
        )}
      </ScrollView>
      {/* the card's back side rises over the roster (2026-07-20) */}
      <CrewSheet
        member={crew.find((m) => m.id === sheetId) ?? null}
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
