import { Text, View } from 'react-native';

import type { Pipeline, PipelineStep } from '@/mock/chat';
import { darkChat, fontFamily, fontSize, spacing, sysColor } from '@/theme/theme';

const STATUS_TAG: Record<PipelineStep['status'], { label: string; color: string }> = {
  done: { label: '[DONE]', color: darkChat.success },
  active: { label: '[ACTIVE]', color: darkChat.text },
  pending: { label: '[PENDING]', color: darkChat.textTertiary },
};

/** The human gate reads differently from machine progress (2026-07-28): an
 * approval step that is "active" is not the system working, it is the system
 * WAITING ON YOU — so it gets its own tag in the action color. */
const GATE_TAG: Record<PipelineStep['status'], { label: string; color: string }> = {
  done: { label: '[APPROVED]', color: darkChat.success },
  active: { label: '[YOUR TURN]', color: sysColor.action },
  pending: { label: '[NEEDS YOU]', color: darkChat.textTertiary },
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
        const tag = (step.gate ? GATE_TAG : STATUS_TAG)[step.status];
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
              {/* WHO owns it — a pipeline that introduces three crew
                  members has to say which one is on each step */}
              {step.owner ? (
                <Text
                  style={{
                    fontFamily: fontFamily.mono,
                    fontSize: 11,
                    color: darkChat.textTertiary,
                  }}>
                  {`  ${step.owner}`}
                </Text>
              ) : null}
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
