import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BlissSwooshBg } from '@/components/ui/bliss-swoosh-bg';
import type { CrewMember } from '@/mock/crew';
import { useAppStore } from '@/store/app-store';
import { fontFamily, fontSize, fontWeight, radius, spacing } from '@/theme/theme';

// blissxp ink tones (see the GLASS palette in the home tab).
const INK = '#1F3A57';
const INK_DIM = 'rgba(31,58,87,0.6)';
const INK_SOFT = 'rgba(31,58,87,0.06)';
const INK_EDGE = 'rgba(31,58,87,0.12)';
const NAME_GHOST = 'rgba(31,58,87,0.14)';

// Character art per agent. Cards without art stay white placeholders.
// (Current images are internal placeholders only, not for release.)
const CREW_ART: Record<string, ImageSourcePropType> = {
  muppet: require('../../../assets/crew/muppet.jpeg'),
  scout: require('../../../assets/crew/beaker.jpeg'),
  quill: require('../../../assets/crew/misspiggy.jpeg'),
  pilot: require('../../../assets/crew/gonzo.jpeg'),
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
        backgroundColor: '#FFFFFF',
        shadowColor: '#2E3252',
        shadowOpacity: 0.13,
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
        backgroundColor: '#FFFFFF',
        shadowColor: '#2E3252',
        shadowOpacity: 0.13,
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
            color: '#2C4A6B',
            fontSize: 11,
            fontWeight: fontWeight.semibold,
            letterSpacing: 1,
          }}>
          ACTION RUNS
        </Text>
        <Text style={{ color: 'rgba(31,58,87,0.45)', fontSize: 10 }}>
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
          borderBottomColor: 'rgba(31,58,87,0.12)',
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
                    borderColor: '#FFFFFF',
                    backgroundColor: '#FFFFFF',
                    marginBottom: -6,
                    zIndex: 1,
                    shadowColor: '#2E3252',
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
                  backgroundColor: '#2E7CD6',
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

/** The hired crew — assistant characters with pro skills. */
export default function CrewScreen() {
  const { crew } = useAppStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#8EC9F0' }} edges={['top']}>
      <StatusBar style="dark" />
      <BlissSwooshBg />
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
          <Text style={{ color: INK_DIM, fontSize: fontSize.small }}>
            {crew.length} agents
          </Text>
        </View>

        <View style={{ gap: spacing.md }}>
          {crew.map((m) => (
            <AgentCard key={m.id} member={m} />
          ))}
          <ContributionCard crew={crew} />
        </View>

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
            borderColor: 'rgba(255,255,255,0.7)',
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
