import { Text, View } from 'react-native';

import type { Pipeline, PipelineStep } from '@/mock/chat';
import { darkChat, fontFamily, fontSize, spacing } from '@/theme/theme';

const STATUS_TAG: Record<PipelineStep['status'], { label: string; color: string }> = {
  done: { label: '[DONE]', color: darkChat.success },
  active: { label: '[ACTIVE]', color: darkChat.text },
  pending: { label: '[PENDING]', color: darkChat.textTertiary },
};

/**
 * Multi-agent pipeline status — how a reply that did real tool/data work
 * shows its steps. No card shell (nothing to click here, unlike Approval/
 * Schedule) — reads as plain inline log output, same column as everything
 * else, with only status tags (no icons/colored dots) to mark progress.
 */
export function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  return (
    <View>
      <Text
        style={{
          fontSize: fontSize.caption,
          fontFamily: fontFamily.semibold,
          letterSpacing: 1,
          color: darkChat.textTertiary,
        }}>
        MULTI-AGENT PIPELINE
      </Text>

      {pipeline.steps.map((step, i) => {
        const tag = STATUS_TAG[step.status];
        return (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: spacing.md,
              paddingVertical: spacing.xs,
            }}>
            <Text
              numberOfLines={1}
              style={{
                flexShrink: 1,
                fontSize: fontSize.small,
                fontFamily: fontFamily.medium,
                color: darkChat.text,
              }}>
              Step {i + 1}. {step.label}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.mono,
                fontSize: 11,
                letterSpacing: 0.4,
                color: tag.color,
              }}>
              {tag.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default PipelineCard;
