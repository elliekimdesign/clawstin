import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ActivityItem, LogStep } from '@/mock/activity';
import { fontFamily } from '@/theme/theme';

// Console palette (matches the Logs tab).
const C = {
  bg: '#18263F',
  text: 'rgba(255,255,255,0.9)',
  dim: 'rgba(255,255,255,0.48)',
  faint: 'rgba(255,255,255,0.32)',
  ok: '#7ED9A0',
  err: '#FF8A7A',
  wait: '#F0B25F',
  agent: '#8FBFF2',
};

/** Synthesize a believable raw payload for a step (mock: the demo has no
 * real network layer; shape follows the step's state). */
function rawFor(step: LogStep, item: ActivityItem): { request: string; response: string } {
  const endpoint = step.label.split(' ')[0];
  const request = JSON.stringify(
    {
      method: endpoint.includes('.') ? 'POST' : 'GET',
      endpoint,
      agent: item.agentId,
      thread: item.threadId,
      timeout_ms: 8000,
    },
    null,
    2
  );
  let response: string;
  if (step.state === 'err') {
    response = JSON.stringify(
      step.label.includes('timeout')
        ? { status: 504, error: 'gateway_timeout', elapsed_ms: 8000 }
        : { status: 429, error: 'rate_limited', retry_after_s: 2, attempts: 3 },
      null,
      2
    );
  } else if (step.state === 'wait') {
    response = JSON.stringify(
      { state: 'paused', reason: 'approval_required', resume: 'user_action' },
      null,
      2
    );
  } else {
    response = JSON.stringify(
      { status: 200, elapsed: step.ms ?? 'n/a', bytes: 48210, cached: false },
      null,
      2
    );
  }
  return { request, response };
}

/** Drill-down sheet for one console step: the raw request/response
 * behind the summary line. Depth on demand for engineers. */
export function RawStepSheet({
  step,
  item,
  agentName,
  onClose,
}: {
  step: LogStep | null;
  item: ActivityItem | null;
  agentName: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const visible = !!step && !!item;
  if (!visible) {
    return null;
  }
  const glyph = step.state === 'err' ? '✗' : step.state === 'wait' ? '…' : '✓';
  const glyphColor = step.state === 'err' ? C.err : step.state === 'wait' ? C.wait : C.ok;
  const raw = rawFor(step, item);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1 }} />
      <View
        style={{
          backgroundColor: C.bg,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          maxHeight: '70%',
          paddingBottom: Math.max(insets.bottom, 12),
          shadowColor: '#000000',
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: -8 },
          elevation: 16,
        }}>
        {/* grabber */}
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.2)',
            marginTop: 8,
          }}
        />
        {/* header: step label + state, then run context */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{ flex: 1, fontFamily: fontFamily.mono, fontSize: 13, color: C.text }}
              numberOfLines={1}>
              {step.label}
            </Text>
            <Text style={{ fontFamily: fontFamily.mono, fontSize: 13, color: glyphColor }}>
              {glyph}
            </Text>
          </View>
          <Text
            style={{ fontFamily: fontFamily.mono, fontSize: 11, color: C.faint, marginTop: 4 }}>
            [{item.time}] <Text style={{ color: C.agent }}>{agentName.toLowerCase()}</Text> ·{' '}
            {item.prompt}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ fontFamily: fontFamily.mono, fontSize: 11, color: C.faint }}>
            # request
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              lineHeight: 17,
              color: C.dim,
              marginTop: 4,
            }}>
            {raw.request}
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              color: C.faint,
              marginTop: 14,
            }}>
            # response
          </Text>
          <Text
            style={{
              fontFamily: fontFamily.mono,
              fontSize: 11,
              lineHeight: 17,
              color: step.state === 'err' ? C.err : step.state === 'wait' ? C.wait : C.dim,
              marginTop: 4,
              marginBottom: 16,
            }}>
            {raw.response}
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default RawStepSheet;
