import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  DINNER_REROUTE_STAGES,
  DINNER_STAGES,
  GraphStage,
  GraphStageStatus,
} from '@/mock/dinner-graph';
import { DEMO_PACE } from '@/store/app-store';
import { fontFamily } from '@/theme/theme';

import { CrewPixel } from './crew-pixel';
import { ThinkingBlob } from './thinking-blob';

/**
 * BACKSTAGE (2026-07-22, the flip view — see memory/flip-crew-graph):
 * the chat screen's back face. The current task's crew handoff graph
 * drawn as circuit-board traces on the console's navy: nodes = crew
 * mascots with their stage line, edges = the handoffs, the glass bead
 * traveling the active trace. Write-stages announce INTENT before
 * executing — the dashed amber window where HOLD can catch them.
 * Read-only plus exactly one verb (Hold); corrections happen in chat.
 */

const PANEL_BG = '#0E1626';
const TRACE = 'rgba(143,178,216,0.4)';
const TRACE_DONE = 'rgba(126,217,160,0.65)';
const TRACE_DIM = 'rgba(143,178,216,0.16)';
const AMBER = '#F0B25F';
const INK_W = 'rgba(255,255,255,0.85)';
const DIM_W = 'rgba(255,255,255,0.45)';
const MONO = fontFamily.mono;

const CREW_NAME: Record<GraphStage['crew'], string> = {
  muppet: 'Beanie',
  scout: 'Specs',
  pilot: 'Crop',
  quill: 'Wink',
};

export type DinnerRunPhase = 'idle' | 'p1' | 'held' | 'p2' | 'done';

/** the flip demo's run state machine — owns pacing and statuses.
 * Phase 1 walks DINNER_STAGES and PARKS on the wrongBeat's intent
 * (the holdable window); hold() freezes it; resume() (fired by the
 * chat-side correction) appends and walks the reroute stages. */
export function useDinnerRun() {
  const [phase, setPhase] = useState<DinnerRunPhase>('idle');
  const [statuses, setStatuses] = useState<Record<string, GraphStageStatus>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, Math.round(ms * DEMO_PACE)));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = useCallback(() => {
    setPhase((p) => {
      if (p !== 'idle') return p;
      const init: Record<string, GraphStageStatus> = {};
      DINNER_STAGES.forEach((s) => (init[s.id] = 'queued'));
      setStatuses(init);
      let at = 200;
      DINNER_STAGES.forEach((s) => {
        later(() => setStatuses((prev) => ({ ...prev, [s.id]: 'running' })), at);
        const dur = 1400;
        if (s.wrongBeat) {
          // the intent window: announce, then WAIT for the human
          later(
            () => setStatuses((prev) => ({ ...prev, [s.id]: 'about' })),
            at + dur * 0.5
          );
          at += dur; // later stages stay queued behind the parked write
        } else {
          later(() => setStatuses((prev) => ({ ...prev, [s.id]: 'done' })), at + dur);
          at += dur;
        }
      });
      return 'p1';
    });
  }, []);

  const hold = useCallback(() => {
    const wrong = DINNER_STAGES.find((s) => s.wrongBeat);
    if (wrong) setStatuses((prev) => ({ ...prev, [wrong.id]: 'held' }));
    setPhase('held');
  }, []);

  const resume = useCallback(() => {
    setPhase('p2');
    setStatuses((prev) => {
      const next = { ...prev };
      DINNER_REROUTE_STAGES.forEach((s) => (next[s.id] = 'queued'));
      return next;
    });
    let at = 400;
    DINNER_REROUTE_STAGES.forEach((s) => {
      later(() => setStatuses((prev) => ({ ...prev, [s.id]: 'running' })), at);
      const dur = 1400;
      if (s.intent) {
        // reroute intents show themselves briefly, then proceed —
        // the human already gave the correcting context
        later(() => setStatuses((prev) => ({ ...prev, [s.id]: 'about' })), at + dur * 0.4);
        later(() => setStatuses((prev) => ({ ...prev, [s.id]: 'done' })), at + dur * 1.6);
        at += dur * 1.6;
      } else {
        later(() => setStatuses((prev) => ({ ...prev, [s.id]: 'done' })), at + dur);
        at += dur;
      }
    });
    later(() => setPhase('done'), at + 500);
  }, []);

  return { phase, statuses, start, hold, resume };
}

/** the bead riding an active trace: loops down the edge's height */
function EdgeBead({ h }: { h: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = 0;
    y.value = withRepeat(
      withTiming(h - 16, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [h, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: -7, top: 0 }, style]}>
      <ThinkingBlob size={16} />
    </Animated.View>
  );
}

/** one vertical trace segment between nodes, with mosaic pads */
function Trace({
  state,
  h = 34,
}: {
  state: 'queued' | 'active' | 'done';
  h?: number;
}) {
  const color = state === 'done' ? TRACE_DONE : state === 'active' ? TRACE : TRACE_DIM;
  return (
    <View style={{ width: 2, height: h, marginLeft: 20, backgroundColor: color }}>
      {/* solder pads at both ends, the mosaic cell language */}
      <View style={{ position: 'absolute', top: -2, left: -1.5, width: 5, height: 5, backgroundColor: color }} />
      <View style={{ position: 'absolute', bottom: -2, left: -1.5, width: 5, height: 5, backgroundColor: color }} />
      {state === 'active' ? <EdgeBead h={h} /> : null}
    </View>
  );
}

function Node({
  stage,
  status,
  onHold,
  onOpenCrew,
}: {
  stage: GraphStage;
  status: GraphStageStatus;
  onHold: () => void;
  onOpenCrew?: (crew: string) => void;
}) {
  const live = status === 'running' || status === 'about';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      {/* node: the crew face on its pad */}
      <Pressable
        onPress={() => onOpenCrew?.(stage.crew)}
        hitSlop={8}
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: live ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: status === 'queued' ? 0.45 : 1,
        }}>
        <CrewPixel id={stage.crew} size={26} />
      </Pressable>
      <View style={{ flex: 1, paddingTop: 2, opacity: status === 'queued' ? 0.45 : 1 }}>
        <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 0.3, color: DIM_W }}>
          {CREW_NAME[stage.crew].toUpperCase()}
        </Text>
        <Text
          style={{ marginTop: 2, fontFamily: MONO, fontSize: 12, lineHeight: 17, color: INK_W }}
          numberOfLines={2}>
          {stage.label}
          <Text style={{ color: DIM_W }}>{`  ${stage.ms}`}</Text>
        </Text>
        {/* verdict line per status */}
        {status === 'done' ? (
          <Text style={{ marginTop: 2, fontFamily: MONO, fontSize: 11, color: TRACE_DONE }}>
            ✓ done
          </Text>
        ) : null}
        {status === 'held' ? (
          <Text style={{ marginTop: 2, fontFamily: MONO, fontSize: 11, color: AMBER }}>
            held by you
          </Text>
        ) : null}
        {/* THE INTENT WINDOW: dashed amber announcement + the one verb */}
        {status === 'about' && stage.intent ? (
          <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 6 }}>
            <View
              style={{
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: AMBER,
                paddingHorizontal: 10,
                paddingVertical: 7,
                alignSelf: 'flex-start',
              }}>
              <Text style={{ fontFamily: MONO, fontSize: 12, color: AMBER }}>
                {stage.intent}
              </Text>
            </View>
            <Pressable
              onPress={onHold}
              hitSlop={8}
              style={({ pressed }) => ({
                marginTop: 8,
                alignSelf: 'flex-start',
                borderWidth: 1.5,
                borderColor: AMBER,
                paddingHorizontal: 16,
                paddingVertical: 7,
                opacity: pressed ? 0.6 : 1,
              })}>
              <Text
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: 1,
                  color: AMBER,
                }}>
                HOLD
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

export function BackstageFlip({
  taskTitle,
  run,
  onClose,
  onOpenCrew,
}: {
  taskTitle: string;
  run: ReturnType<typeof useDinnerRun>;
  onClose: () => void;
  onOpenCrew?: (crew: string) => void;
}) {
  const { phase, statuses, hold } = run;
  const stages =
    phase === 'p2' || phase === 'done'
      ? [...DINNER_STAGES, ...DINNER_REROUTE_STAGES]
      : DINNER_STAGES;

  const edgeState = (i: number): 'queued' | 'active' | 'done' => {
    const from = statuses[stages[i].id];
    const to = statuses[stages[i + 1].id];
    if (from === 'done' && (to === 'running' || to === 'about')) return 'active';
    if (from === 'done' && to === 'done') return 'done';
    return 'queued';
  };

  return (
    <View style={{ flex: 1, backgroundColor: PANEL_BG }}>
      {/* header: what this is + the way back */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 66,
          paddingBottom: 14,
        }}>
        <View>
          <Text style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: DIM_W }}>
            BACKSTAGE
          </Text>
          <Text style={{ marginTop: 3, fontFamily: MONO, fontSize: 13, color: INK_W }}>
            {`task  "${taskTitle}"`}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}>
          <Text style={{ color: INK_W, fontSize: 14 }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}>
        {stages.map((s, i) => (
          <View key={s.id}>
            {/* the reroute seam: where the graph learned from you */}
            {phase !== 'p1' && phase !== 'idle' && i === DINNER_STAGES.length ? (
              <Animated.View
                entering={FadeIn.duration(400)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginVertical: 8,
                  marginLeft: 8,
                }}>
                <View
                  style={{
                    width: 26,
                    height: 2,
                    backgroundColor: AMBER,
                    opacity: 0.7,
                  }}
                />
                <Text style={{ fontFamily: MONO, fontSize: 11, color: AMBER }}>
                  rerouted  "Jenna is vegetarian"
                </Text>
              </Animated.View>
            ) : null}
            <Node stage={s} status={statuses[s.id] ?? 'queued'} onHold={hold} onOpenCrew={onOpenCrew} />
            {i < stages.length - 1 ? <Trace state={edgeState(i)} /> : null}
          </View>
        ))}
        {phase === 'held' ? (
          <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 18 }}>
            <Text style={{ fontFamily: MONO, fontSize: 12, lineHeight: 18, color: DIM_W }}>
              Run held. Flip back and tell the crew what they missed.
            </Text>
          </Animated.View>
        ) : null}
        {phase === 'done' ? (
          <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: 18 }}>
            <Text style={{ fontFamily: MONO, fontSize: 12, color: TRACE_DONE }}>
              ✓ Task complete. The invite is waiting on your approval.
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default BackstageFlip;
