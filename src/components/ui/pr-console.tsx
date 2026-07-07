import { Text, View } from 'react-native';

import { PENDING_PRS } from '@/mock/github';
import { fontFamily, fontSize, spacing } from '@/theme/theme';

// Same deep navy as every other system surface.
const PANEL_BG = '#0E1626';
const MONO = 'Menlo';
const TEXT = '#FFFFFF';
const DIM = 'rgba(255,255,255,0.45)';
const LABEL = 'rgba(255,255,255,0.55)';
const REVIEW = '#F0812F';
const PASSED = '#7ED9A0';

/**
 * PR console — the dynamic console as a GitHub micro-app: the pending
 * PRs the crew just pulled, engineer-grade typography (sans titles,
 * mono branches and hashes, colored status badges). Pure DATA view;
 * the calendar ACTION lives down in the chat bubble.
 */
export function PRConsole() {
  return (
    <View
      style={{
        backgroundColor: PANEL_BG,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
      <Text
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: 1,
          color: DIM,
          marginBottom: spacing.sm,
        }}>
        {'pending PRs · '}
        {PENDING_PRS.length}
      </Text>
      {PENDING_PRS.map((pr, i) => (
        <View
          key={pr.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.sm,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: 'rgba(255,255,255,0.08)',
          }}>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                color: TEXT,
                fontSize: fontSize.small,
                fontFamily: fontFamily.semibold,
              }}>
              {pr.title}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: MONO, fontSize: 11, color: LABEL, marginTop: 2 }}>
              {pr.branch}
              {' · '}
              {pr.hash}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: 0.4,
              color: pr.status === 'review' ? REVIEW : PASSED,
              marginLeft: spacing.md,
            }}>
            {pr.status === 'review' ? 'Review required' : 'Checks passed'}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default PRConsole;
