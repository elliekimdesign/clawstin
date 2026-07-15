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
import { CREW_ACCENT, CrewPixel } from '@/components/ui/crew-pixel';
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
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.62)' }]}
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
function CrewBadge({ member, width }: { member: CrewMember; width: number }) {
  const roleTag = member.role.split(' · ')[0];
  return (
    <View style={{ width, paddingTop: 28 }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: width / 2 - 28,
          zIndex: 2,
          width: 56,
          height: 56,
          borderRadius: 999,
          backgroundColor: CARD,
          borderWidth: 1,
          borderColor: 'rgba(22,24,28,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#26301F',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 7,
        }}>
        <CrewPixel id={member.id} size={40} />
      </View>
      <Pressable
        onPress={() => router.push(`/crew/${member.id}`)}
        style={({ pressed }) => ({
          borderRadius: 0,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.55)',
          alignItems: 'center',
          paddingTop: 38,
          shadowColor: '#26301F',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
          opacity: pressed ? 0.9 : 1,
        })}>
        <CardGlass />
        <Text
          style={{
            fontSize: 17,
            fontFamily: fontFamily.bold,
            letterSpacing: -0.3,
            color: INK,
          }}>
          {member.name}
        </Text>
        <View
          style={{
            width: 26,
            height: 3,
            borderRadius: 99,
            marginTop: 7,
            backgroundColor: CREW_ACCENT[member.id] ?? INK_EDGE,
          }}
        />
        <Text
          style={{
            marginTop: 8,
            fontSize: 10,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.3,
            color: INK_DIM,
          }}>
          {roleTag.toUpperCase()}
        </Text>
        <View
          style={{
            marginTop: 14,
            alignSelf: 'stretch',
            backgroundColor: INK_SOFT,
            paddingVertical: 9,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              backgroundColor: member.active ? sysColor.ready : 'rgba(22,24,28,0.25)',
            }}
          />
          <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
            {member.active ? 'ready' : 'paused'}
          </Text>
          <View style={{ width: 10 }} />
          <Text style={{ fontSize: 10, fontFamily: fontFamily.mono, color: INK_DIM }}>
            {`${member.tasksDone} runs`}
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
  const maxTasks = Math.max(...crew.map((m) => m.tasksDone));
  return (
    <View
      style={{
        borderRadius: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        shadowColor: '#26301F',
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        paddingTop: 14,
        paddingBottom: 14,
        paddingHorizontal: 20,
      }}>
      <CardGlass />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{
            color: INK_DIM,
            fontSize: 11,
            fontFamily: fontFamily.semibold,
            letterSpacing: 1,
          }}>
          ACTION RUNS
        </Text>
        <Text style={{ color: 'rgba(22,24,28,0.45)', fontSize: 10 }}>
          tasks, last 7 days
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          marginTop: 14,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(22,24,28,0.12)',
          paddingBottom: 0,
        }}>
        {crew.map((m) => {
          const barH = 16 + (m.tasksDone / maxTasks) * 90;
          return (
            <View key={m.id} style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={{
                  color: brandBlue,
                  fontSize: 11,
                  fontFamily: fontFamily.semibold,
                  marginBottom: 4,
                }}>
                {m.tasksDone}
              </Text>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: CARD,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: -6,
                  zIndex: 1,
                }}>
                <CrewPixel id={m.id} size={30} />
              </View>
              <View
                style={{
                  width: 26,
                  height: barH,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  backgroundColor: CREW_ACCENT[m.id] ?? '#8FBFF2',
                }}
              />
            </View>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: 6,
        }}>
        {crew.map((m) => (
          <Text
            key={m.id}
            numberOfLines={1}
            style={{ flex: 1, textAlign: 'center', color: INK_DIM, fontSize: 10 }}>
            {m.role.split(' · ')[0]}
          </Text>
        ))}
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
        borderRadius: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        shadowColor: '#26301F',
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        padding: 14,
        opacity: pressed ? 0.9 : 1,
      })}>
      <CardGlass />
      {/* header in the badge grammar: chip, name over accent
          underline, mono role — same anatomy as the roster cards */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: CARD,
            borderWidth: 1,
            borderColor: 'rgba(22,24,28,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <CrewPixel id={member.id} size={30} />
        </View>
        <View>
          <Text
            style={{
              fontSize: 15,
              fontFamily: fontFamily.bold,
              letterSpacing: -0.2,
              color: INK,
            }}>
            {member.name}
          </Text>
          <View
            style={{
              width: 22,
              height: 2.5,
              borderRadius: 99,
              marginTop: 4,
              backgroundColor: CREW_ACCENT[member.id] ?? INK_EDGE,
            }}
          />
        </View>
        <View style={{ flex: 1 }} />
        <Text
          style={{
            fontSize: 10,
            fontFamily: fontFamily.mono,
            letterSpacing: 0.3,
            color: INK_DIM,
          }}>
          {roleTag.toUpperCase()}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
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
    <View
      style={{
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        borderRadius: 0,
        padding: 3,
      }}>
      <CardGlass />
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
          // the roster: profile badges in two columns; tap = detail
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
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
                paddingTop: 28,
                opacity: pressed ? 0.6 : 1,
              })}>
              {/* the empty seat: 무난하게 — the exact chip the real
                  members wear (solid plate, hairline, shadow) with a
                  plain + inside; every clever variant is in git history */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: badgeW / 2 - 28,
                  zIndex: 2,
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  backgroundColor: CARD,
                  borderWidth: 1,
                  borderColor: 'rgba(22,24,28,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#26301F',
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 7,
                }}>
                <Ionicons name="add" size={26} color="rgba(22,24,28,0.65)" />
              </View>
              <View
                style={{
                  borderRadius: 0,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.35)',
                  alignItems: 'center',
                  paddingTop: 38,
                }}>
                <CardGlass />
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: fontFamily.bold,
                    letterSpacing: -0.3,
                    color: INK_DIM,
                  }}>
                  Add crew
                </Text>
                {/* the accent underline, waiting for its color */}
                <View
                  style={{
                    width: 26,
                    height: 3,
                    borderRadius: 99,
                    marginTop: 7,
                    backgroundColor: 'rgba(22,24,28,0.15)',
                  }}
                />
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    fontFamily: fontFamily.mono,
                    letterSpacing: 0.3,
                    color: INK_DIM,
                  }}>
                  OPEN SLOT
                </Text>
                <View
                  style={{
                    marginTop: 14,
                    alignSelf: 'stretch',
                    backgroundColor: INK_SOFT,
                    paddingVertical: 9,
                    alignItems: 'center',
                  }}>
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
    </SafeAreaView>
  );
}
