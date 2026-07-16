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
import { AcidGlassFill } from '@/components/ui/window-fill';
import { CREW_ACCENT, CrewPixel } from '@/components/ui/crew-pixel';
import { PixelChrome } from '@/components/ui/pixel-chrome';
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

/** the member's accessory color as a bare swatch riding beside the
 * name (2026-07-16: the "COLOR" tag read as clutter — the small square
 * says it alone). No color yet = empty outlined swatch. */
function ColorSwatch({ color }: { color?: string }) {
  return (
    <View
      style={{
        width: 6,
        height: 6,
        backgroundColor: color ?? 'transparent',
        borderWidth: color ? 0 : 1,
        borderColor: 'rgba(22,24,28,0.3)',
      }}
    />
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
/** The crew badge as a HOME WINDOW (2026-07-16 "같은 카드 질감을
 * 그대로": the flat vintage paper was a foreign material — the badge
 * now wears the board's own AcidGlassFill, tinted title strip and
 * hairline). Window grammar mapping: strip label = the member's ROLE,
 * body = face + name + accent bar, bottom-left meta = runs (the "5
 * routines" slot). "ready" stays dropped; paused shows as the
 * exception. */
function CrewBadge({ member, width }: { member: CrewMember; width: number }) {
  const roleTag = member.role.split(' · ')[0];
  return (
    <View style={{ width }}>
      <Pressable
        onPress={() => router.push(`/crew/${member.id}`)}
        style={({ pressed }) => ({
          borderRadius: 0,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.55)',
          shadowColor: '#16181C',
          shadowOpacity: 0.07,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
          opacity: pressed ? 0.85 : 1,
        })}>
        <AcidGlassFill effect="clear" bright tone="gray" />
        <View style={{ height: 30, justifyContent: 'center', paddingHorizontal: 14 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: fontFamily.mono,
              letterSpacing: 0.3,
              color: 'rgba(22,24,28,0.55)',
            }}>
            {roleTag.toUpperCase()}
          </Text>
        </View>
        {/* SYSTEM ROW (2026-07-16 "페이스는 왼쪽 글씨는 오른쪽"):
            small face left, left-aligned registry text right — the
            chat readout's anatomy on the light card */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 14,
          }}>
          <CrewPixel id={member.id} size={30} />
          <View style={{ gap: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PixelText text={member.name.toUpperCase()} cell={1.4} color={INK} led />
              <ColorSwatch color={CREW_ACCENT[member.id]} />
            </View>
            {/* meta stays in the plain machine voice — bitmap is the
                NAME's register only (2026-07-16 "여기까지 픽셀 안써도돼") */}
            <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
              {member.active ? `${member.tasksDone} runs` : `paused, ${member.tasksDone} runs`}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

/** One chart card comparing the whole crew: a vertical bar per agent
 * (height = share of the busiest agent's completed tasks) with the
 * agent's round face chip sitting on top of their bar. */
function ContributionCard({ crew }: { crew: CrewMember[] }) {
  const maxTasks = Math.max(...crew.map((m) => m.tasksDone));
  return (
    <View
      style={{
        // HOME WINDOW chrome (2026-07-16 "홈탭같은 스타일로 섹션"):
        // glass fill + tinted title strip, the board's own shadow
        borderRadius: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        shadowColor: '#16181C',
        shadowOpacity: 0.07,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
      }}>
      <AcidGlassFill effect="clear" bright tone="gray" />
      <View
        style={{
          height: 30,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
        }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.3,
            color: 'rgba(22,24,28,0.55)',
          }}>
          ACTION RUNS
        </Text>
        <Text style={{ color: 'rgba(22,24,28,0.45)', fontSize: 10 }}>
          tasks, last 7 days
        </Text>
      </View>
      {/* SYSTEM MONITOR rows (2026-07-16 — the standing faces-on-bars
          read as foreign): one row per member, a 12-cell pixel gauge
          in their accent color (the RUNNING window's own block
          grammar), count in the machine voice on the right */}
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, gap: 13 }}>
        {crew.map((m) => {
          const lit = Math.max(1, Math.round((m.tasksDone / maxTasks) * 12));
          return (
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
                {m.role.split(' · ')[0].toUpperCase()}
              </Text>
              <View style={{ flexDirection: 'row', gap: 2, flex: 1 }}>
                {Array.from({ length: 12 }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor:
                        i < lit ? (CREW_ACCENT[m.id] ?? '#8FBFF2') : 'rgba(22,24,28,0.08)',
                    }}
                  />
                ))}
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
          );
        })}
      </View>
    </View>
  );
}

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
  return (
    <Pressable
      onPress={() => router.push(`/crew/history/${member.id}`)}
      style={({ pressed }) => ({
        // HOME WINDOW chrome, like the Info roster cards
        borderRadius: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        shadowColor: '#16181C',
        shadowOpacity: 0.07,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
        opacity: pressed ? 0.9 : 1,
      })}>
      <AcidGlassFill effect="clear" bright tone="gray" />
      {/* strip carries the ROLE, same as the Info cards */}
      <View style={{ height: 30, justifyContent: 'center', paddingHorizontal: 18 }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.3,
            color: 'rgba(22,24,28,0.55)',
          }}>
          {roleTag.toUpperCase()}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 }}>
      {/* header in the roster cards' system-row anatomy: bare face,
          bitmap name, swatch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CrewPixel id={member.id} size={30} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <PixelText text={member.name.toUpperCase()} cell={1.4} color={INK} led />
          <ColorSwatch color={CREW_ACCENT[member.id]} />
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
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: spacing.xl,
            marginBottom: spacing.lg,
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
              <CrewBadge key={m.id} member={m} width={badgeW} />
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
                opacity: pressed ? 0.6 : 1,
              })}>
              <View
                style={{
                  borderRadius: 0,
                  overflow: 'hidden',
                  // the board's own window material, like its siblings;
                  // the pixel chrome frame stays — the open slot asks
                  // to be filled, same grammar as Home's YOUR TURN
                }}>
                <AcidGlassFill effect="clear" bright tone="gray" />
                <View style={{ height: 30, justifyContent: 'center', paddingHorizontal: 14 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: fontFamily.mono,
                      letterSpacing: 0.3,
                      color: 'rgba(22,24,28,0.55)',
                    }}>
                    OPEN SLOT
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingTop: 12,
                    paddingBottom: 14,
                  }}>
                  {/* the empty seat: a bare + where the face would sit */}
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Ionicons name="add" size={24} color="rgba(22,24,28,0.5)" />
                  </View>
                  <View style={{ gap: 7 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <PixelText text="ADD CREW" cell={1.4} color={INK_DIM} led />
                      <ColorSwatch />
                    </View>
                    <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
                      tap to hire
                    </Text>
                  </View>
                </View>
                {/* drawn LAST so the frame rides over everything */}
                <PixelChrome />
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
    </SafeAreaView>
  );
}
