import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Image,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DarkCloudBg } from '@/components/ui/dark-cloud-bg';
import type { ActivityItem } from '@/mock/activity';
import type { CrewMember } from '@/mock/crew';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

// cinema tones: the Crew tab shares the home board's dark_cloud field,
// and the cards go DARKER than the field — characters lit like movie
// stars on a dim stage. Light ink on dark surface.
const CARD = '#16233A'; // baked into assets/crew/dark/* canvases too
const INK = '#F3F8FC';
const INK_DIM = 'rgba(243,248,252,0.6)';
const INK_SOFT = 'rgba(255,255,255,0.08)';
const INK_EDGE = 'rgba(255,255,255,0.18)';
const NAME_GHOST = 'rgba(255,255,255,0.09)';

// Character art per agent. Cards without art stay white placeholders.
// (Current images are internal placeholders only, not for release.)
const CREW_ART: Record<string, ImageSourcePropType> = {
  muppet: require('../../../assets/crew/dark/muppet.jpeg'),
  scout: require('../../../assets/crew/dark/beaker.jpeg'),
  quill: require('../../../assets/crew/dark/misspiggy.jpeg'),
  pilot: require('../../../assets/crew/dark/gonzo.jpeg'),
};


/** One agent card: a white placeholder canvas (character art lands here
 * later) with the agent's name as huge display type clipped at the bottom
 * edge, a role pill top-left, and a "..." circle top-right. Tap → detail. */
function AgentCard({ member }: { member: CrewMember }) {
  const roleTag = member.role.split(' · ')[0];
  const art = CREW_ART[member.id];
  return (
    <Pressable
      onPress={() => router.push(`/crew/${member.id}`)}
      style={({ pressed }) => ({
        height: 200,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: CARD,
        shadowColor: '#000000',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        opacity: pressed ? 0.9 : 1,
      })}>
      {/* character art fills the card when available */}
      {art ? (
        <Image
          source={art}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: undefined,
            height: undefined,
            resizeMode: 'cover',
          }}
        />
      ) : null}

      {/* huge clipped name, like the reference's giant month type */}
      <Text
        numberOfLines={1}
        style={{
          position: 'absolute',
          bottom: -14,
          left: 20,
          fontSize: 76,
          fontFamily: fontFamily.bold,
          letterSpacing: -2,
          color: NAME_GHOST,
        }}>
        {member.name}
      </Text>

      {/* role pill */}
      <View
        style={{
          position: 'absolute',
          top: spacing.lg,
          left: spacing.lg,
          backgroundColor: INK_SOFT,
          borderWidth: 1,
          borderColor: INK_EDGE,
          borderRadius: radius.pill,
          paddingVertical: 6,
          paddingHorizontal: 12,
        }}>
        <Text style={{ color: INK, fontSize: 12, fontWeight: fontWeight.semibold }}>
          {roleTag}
        </Text>
      </View>

      {/* "..." circle */}
      <View
        style={{
          position: 'absolute',
          top: spacing.lg,
          right: spacing.lg,
          width: 30,
          height: 30,
          borderRadius: 999,
          backgroundColor: INK_SOFT,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons name="ellipsis-horizontal" size={16} color={INK} />
      </View>
    </Pressable>
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
        borderRadius: 22,
        backgroundColor: CARD,
        shadowColor: '#000000',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        paddingTop: 14,
        paddingBottom: 14,
        paddingHorizontal: 20,
      }}>
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
            fontWeight: fontWeight.semibold,
            letterSpacing: 1,
          }}>
          ACTION RUNS
        </Text>
        <Text style={{ color: 'rgba(243,248,252,0.45)', fontSize: 10 }}>
          tasks · last 7 days
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          marginTop: 14,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.14)',
          paddingBottom: 0,
        }}>
        {crew.map((m) => {
          const barH = 16 + (m.tasksDone / maxTasks) * 90;
          const art = CREW_ART[m.id];
          return (
            <View key={m.id} style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={{
                  color: INK_DIM,
                  fontSize: 11,
                  fontWeight: fontWeight.semibold,
                  marginBottom: 4,
                }}>
                {m.tasksDone}
              </Text>
              {art ? (
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    overflow: 'hidden',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.35)',
                    backgroundColor: CARD,
                    marginBottom: -6,
                    zIndex: 1,
                    shadowColor: '#000000',
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  }}>
                  <Image
                    source={art}
                    style={{ width: 36, height: 36, resizeMode: 'cover' }}
                  />
                </View>
              ) : null}
              <View
                style={{
                  width: 26,
                  height: barH,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  backgroundColor: '#8FBFF2',
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
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingVertical: 10,
        paddingHorizontal: 12,
      }}>
      <Text
        style={{
          color: INK_DIM,
          fontSize: 9,
          fontWeight: fontWeight.semibold,
          letterSpacing: 0.8,
        }}>
        {label}
      </Text>
      <Text
        style={{
          color: INK,
          fontSize: 17,
          fontWeight: fontWeight.semibold,
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
  const art = CREW_ART[member.id];
  return (
    <Pressable
      onPress={() => router.push(`/crew/history/${member.id}`)}
      style={({ pressed }) => ({
        borderRadius: 22,
        backgroundColor: CARD,
        shadowColor: '#000000',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        padding: 14,
        opacity: pressed ? 0.9 : 1,
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: INK_SOFT,
            borderWidth: 1,
            borderColor: INK_EDGE,
            borderRadius: radius.pill,
            paddingVertical: 4,
            paddingLeft: 5,
            paddingRight: 12,
          }}>
          {art ? (
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                overflow: 'hidden',
                backgroundColor: CARD,
              }}>
              <Image
                source={art}
                style={{ width: 22, height: 22, resizeMode: 'cover' }}
              />
            </View>
          ) : null}
          <Text style={{ color: INK, fontSize: 12, fontWeight: fontWeight.semibold }}>
            {roleTag}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            backgroundColor: INK_SOFT,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="ellipsis-horizontal" size={16} color={INK} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <StatTile label="AUTONOMY" value={`${member.autonomy}%`} />
        <StatTile label="TIME SAVED" value={`${member.timeSavedH}h`} />
        <StatTile label="TOKENS" value={`${member.tokensM}M`} />
      </View>

      {/* the actual user prompts this agent handled, newest first --
          seeing who handled what nudges the user toward Add crew */}
      <View style={{ marginTop: 12, paddingHorizontal: 2 }}>
        <Text
          style={{
            color: INK_DIM,
            fontSize: 9,
            fontWeight: fontWeight.semibold,
            letterSpacing: 0.8,
            marginBottom: 6,
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
              marginBottom: 4,
              opacity: pressed ? 0.6 : 1,
            })}>
            <Text style={{ color: 'rgba(243,248,252,0.35)', fontSize: 12 }}>
              {'\u21b3'}
            </Text>
            <Text
              numberOfLines={1}
              style={{ flex: 1, color: 'rgba(243,248,252,0.75)', fontSize: 12 }}>
              {entry.prompt}
            </Text>
            <Text style={{ color: 'rgba(243,248,252,0.45)', fontSize: 12 }}>
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
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        borderRadius: radius.pill,
        padding: 3,
      }}>
      {(['info', 'perf'] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          style={{
            paddingVertical: 5,
            paddingHorizontal: 16,
            borderRadius: radius.pill,
            backgroundColor: mode === m ? 'rgba(255,255,255,0.25)' : 'transparent',
            shadowColor: '#000000',
            shadowOpacity: mode === m ? 0.12 : 0,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          }}>
          <Text
            style={{
              color: mode === m ? INK : INK_DIM,
              fontSize: 12,
              fontWeight: fontWeight.semibold,
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

  const switchMode = (m: 'info' | 'perf') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(m);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#243A54' }} edges={['top']}>
      <StatusBar style="light" />
      <DarkCloudBg />
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
              color: INK,
              fontSize: fontSize.largeTitle,
              fontWeight: fontWeight.bold,
              letterSpacing: -0.5,
            }}>
            Crew
          </Text>
          <ModeToggle mode={mode} onChange={switchMode} />
        </View>

        {mode === 'info' ? (
          <View style={{ gap: spacing.md }}>
            {crew.map((m) => (
              <AgentCard key={m.id} member={m} />
            ))}
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

        {/* Add crew — MVP placeholder */}
        <Pressable
          onPress={() => Alert.alert('Coming soon', 'Hiring new crew members is on the way.')}
          style={({ pressed }) => ({
            marginTop: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: 'rgba(255,255,255,0.35)',
            opacity: pressed ? 0.6 : 1,
          })}>
          <Ionicons name="add" size={18} color={INK} />
          <Text style={{ color: INK, fontSize: fontSize.body, fontWeight: fontWeight.semibold }}>
            Add crew
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
